import { Component, OnDestroy, OnInit } from '@angular/core';
import { CustomCalendarComponent } from '../../components/custom-calendar/custom-calendar.component';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ShareService } from '../../services/share.service';
import { AssignedProject, ProjectService } from '../../services/project.service';
import { ToastService } from '../../services/toast.service';
import { debounceTime, distinctUntilChanged, map, ReplaySubject, Subject, Subscription, switchMap, takeUntil } from 'rxjs';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ITimesheetRes, TimesheetService, TimesheetStatus } from '../../services/timesheet.service';
import { calendarActions, CalendarEvent, CalendarService } from '../../components/custom-calendar/calendar.service';
import { endOfDay, isSameMonth, isSameYear } from 'date-fns';
import { HourMinutePipe } from '../../core/timeFormat.pipe';
import { ProfileTileModule } from '../../components/profile-tile/profile-tile.module';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-timesheets',
  imports: [CustomCalendarComponent, ReactiveFormsModule, DatePipe, AsyncPipe, HourMinutePipe, ProfileTileModule],
  templateUrl: './timesheets.component.html',
  styleUrl: './timesheets.component.scss'
})
export class TimesheetsComponent implements OnInit, OnDestroy{
  public timesheetForm: FormGroup = new FormGroup({});
  public formAction: 'Add' | 'Update' = 'Add';
  private timesheetId: string = "";
  public isPermit: boolean = false;
  public loggedinUserID: string = "";
  public selectedUserId: string = "";
  public projectLoading: boolean = true;
  public timesheetLoading: boolean = true;
  public projectList: AssignedProject[] = [];
  public timesheetList: ITimesheetRes[] = [];
  private apiSubscriber = new Subscription;
  public selectedDate = new Date();
  public calendarDate = new Date();
  public openForm: boolean = false;
  public viewType: FormControl = new FormControl("Calendar");
  public remarkCtrl: FormControl = new FormControl<string>("", Validators.required);
  public monthCtrl: FormControl = new FormControl();
  public selectedTimesheet!: ITimesheetRes;
  public maxDate: string = '';
  public selectedUser: {uuid: string, name: string} = {uuid: "", name: ""};
  public selectedProject: {uuid: string, name: string} = {uuid: "", name: ""};
  public userList$: ReplaySubject<Array<{ uuid: string, name: string }>> = new ReplaySubject(10);
  public projectList$: ReplaySubject<Array<AssignedProject>> = new ReplaySubject(10);
  public selectedProjectID: string = "";
  public statusFilter: string = "";
  public searchInput$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private _fb: FormBuilder,
    private sharedServ: ShareService,
    private projectServ: ProjectService,
    private timesheetServ: TimesheetService,
    private calendarServ: CalendarService,
    private toastr: ToastService,
  ){
    auth.loggedinUser.subscribe({
      next: (value) => {
        this.isPermit = value?.permissions.includes("timesheet") || false;
        this.loggedinUserID = value?.uuid || "";
        // this.selectedUser = this.loggedinUserID;
      },
    });
  }
  
  ngOnInit(): void {
    this.buildForm();
    this.fetchProjects();
    this.fetchUser("");
    this.monthCtrl.valueChanges.subscribe({
      next: (val) => {
        this.fetchTimesheet();
      }
    });
    this.monthCtrl.patchValue(`${this.calendarDate.getFullYear().toString()}-${(this.calendarDate.getMonth()+1).toString().padStart(2, '0')}`);
    this.maxDate = this.sharedServ.dateForInput(new Date());
    this.viewType.valueChanges.subscribe({
      next: (value) => {
        console.log(value);
      },
    });
    this.searchInput$.pipe(debounceTime(500), distinctUntilChanged(), switchMap(search => this.sharedServ.getUsers({skip: 0, limit: 20}, search)), map(res => res.success ? this.removeDuplicates(res.data.docs) : []), takeUntil(this.destroy$)).subscribe({
      next: (value) => this.userList$.next(value)
    });
  }

  private removeDuplicates(users: Array<{ uuid: string, name: string }>): Array<{ uuid: string, name: string }> {
    const map = new Map<string, { uuid: string, name: string }>();
    users.forEach(user => map.set(user.uuid, user));
    return Array.from(map.values());
  }

  ngOnDestroy(): void {
    if(this.apiSubscriber) this.apiSubscriber.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Build timesheet Form and project id control
  private buildForm(): void {
    this.formAction = "Add";
    const newDate = this.sharedServ.dateForInput(this.selectedDate);
    this.timesheetForm = this._fb.group({
      projectId: this._fb.control<string>({value: '', disabled: this.projectList.length < 1}, Validators.required),
      timesheetDate: this._fb.control<string>({value: newDate, disabled: false}, Validators.required),
      tasks: this._fb.array([this.tasksFormGroup()]),
    });
  }

  // Create Task group 
  private tasksFormGroup(data = {title: "", description: "", timeTaken: 0}): FormGroup {
    return this._fb.group({
      title: this._fb.control<string>({value: data.title, disabled: false}, Validators.compose([Validators.required, Validators.maxLength(100), Validators.minLength(5)])),
      description: this._fb.control<string>({value: data.description, disabled: false}, Validators.compose([Validators.required, Validators.maxLength(1500), Validators.minLength(5)])),
      timeTaken: this._fb.control<number>({value: data.timeTaken, disabled: false}, Validators.compose([Validators.required, Validators.max(480), Validators.min(1)])),
    });
  }

  // Get task from array from timesheet form group
  public get taskFormArray(): FormArray {
    return (this.timesheetForm.get('tasks') as FormArray);
  }
  // Add new task form group in task form array
  public addNewTask(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    this.taskFormArray.push(this.tasksFormGroup());
  }
  // Remove task item from task form array
  public removeTaskItem(event: Event, index: number): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    this.taskFormArray.removeAt(index);
  }
  // Generate Id for tracking form array item
  public arrayItemId = (index: number) => `task_${index}`;
  // Generate Id for tracking form array item
  public arrayItemCtrl(index: number, ctrlStr: string): AbstractControl | null{
    return (this.taskFormArray.controls[index] as FormGroup).get(ctrlStr);
  }

  private fetchUser(search: string = ""): void {
    this.apiSubscriber = this.sharedServ.getUsers({skip: 0, limit: 50}, search).subscribe({
      next: (value) => {
        if(value.success && Array.isArray(value.data.docs)){
          this.userList$.next(value.data.docs);
        }
      },
      error: (err) => this.projectLoading = false,
    });
  }

  private fetchProjects(): void {
    this.apiSubscriber = this.projectServ.getAssignedProject({skip: 0, limit: 50}).subscribe({
      next: (value) => {
        if(value.success && Array.isArray(value.data.docs)){
          this.projectList = value.data.docs;
          this.projectList$.next(this.projectList);
          if(this.projectList.length > 0) this.timesheetForm.controls['projectId'].enable();
        }
        this.projectLoading = false;
      },
      error: (err) => this.projectLoading = false,
    });
  }
  
  private fetchTimesheet(): void {
    this.timesheetLoading = true;
    this.timesheetList = [];
    this.apiSubscriber = this.timesheetServ.getMonthTimesheet({reqDate: this.calendarDate, employeeId: this.selectedUserId}).subscribe({
      next: (value) => {
        if(value.success && Array.isArray(value.data.docs)){
          this.timesheetList = value.data.docs;
        }
        const calendarEvent: CalendarEvent[] = this.timesheetList.map(item => this.timesheetServ.newCalendarEvent(item, this.eventActions.bind(this), (item.createdBy !== this.loggedinUserID)));
        this.calendarServ.setAllEvents(calendarEvent);
        this.timesheetLoading = false;
      },
      error: (err) => this.timesheetLoading = false,
    });
  }

  public employeeFilter(event: Event): void {
    event.stopPropagation();
    this.fetchTimesheet();
  }

  public get inputDateFormat(): string {return this.sharedServ.dateForInput(this.selectedDate);}
  public get isDateChanged(): boolean {return this.calendarDate.toLocaleDateString() !== this.selectedDate.toLocaleDateString();}
  public tasksTitles(arrayItem: Array<{title: string}>): string {return arrayItem.flatMap(e => e.title).join(', ');}

  public onDateEvent(event: Date): void {
    this.selectedDate = event;
    if(isSameMonth(event, this.calendarDate) && isSameYear(event, this.calendarDate)) return;
    this.calendarDate = event;
    this.monthCtrl.patchValue(`${event.getFullYear().toString()}-${(event.getMonth()+1).toString().padStart(2, '0')}`);
  }
  public onMonthChange(event: Date): void {
  }

  // search user
  public onSearchUser(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    const inputEle = event.target as HTMLInputElement;
    console.log(inputEle);
    if(!inputEle) return;
    const value = inputEle.value.toString().trim();
    if(value === '' || value.length > 2){
      this.searchInput$.next(value);
    }
  }
  // Select user from dropdwn
  public selectUser(event: Event, item: {name: string, uuid: string}): void {
    event.stopPropagation();
    this.selectedUser = item;
    this.selectedUserId = item.uuid;
    // Clear search input
    const input = (event.target as HTMLElement)?.closest('.dropdown-menu')?.querySelector('input');
    if (input) (input as HTMLInputElement).value = '';

    // Close dropdown manually
    document.querySelector('.dropdown-menu.show')?.classList.remove('show');
  }
  // search Project
  public onSearchProject(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    const inputEle = event.target as HTMLInputElement;
    if(!inputEle) return;
    const value = inputEle.value.toString().trim();
    if(value === '' || value.length > 2){
      this.projectList$.next(this.projectList.filter((e) => e.projectDetail.name.toLocaleUpperCase().includes(value.toLocaleUpperCase())));
    }
  }
  // Select user from dropdwn
  public selectProjectFilter(event: Event, item: {name: string, uuid: string}): void {
    event.stopPropagation();
    this.selectedProject = item;
    this.selectedProjectID = item.uuid;
    // Clear search input
    const input = (event.target as HTMLElement)?.closest('.dropdown-menu')?.querySelector('input');
    if (input) (input as HTMLInputElement).value = '';

    // Close dropdown manually
    document.querySelector('.dropdown-menu.show')?.classList.remove('show');
    this.projectList$.next(this.projectList);
  }
  // Clear filter entities
  public clearfilter(event: Event, type: 'project' | 'user'): void{
    event.stopPropagation();
    if(type !== 'project'){
      this.selectedUser = {uuid: "", name: ""};
      this.selectedUserId  = "";
    } else {
      this.selectedProjectID = "";
    }
    // Close dropdown manually
    document.querySelector('.dropdown-menu.show')?.classList.remove('show');
  }
  public get badge(): number {return (this.selectedUser.name.trim() !== '' ? 1 : 0) + (this.selectedProject.name.trim() !== '' ? 1 : 0) + (this.statusFilter.trim() !== '' ? 1 : 0) ;}

  // Function to reset form
  public rebuildForm(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    this.timesheetForm.reset();
    this.buildForm();
  }

  // private eventActions = (event: Event, item: CalendarEvent, action: calendarActions): void => {
  // ------------ If you do this, you no longer need to use .bind(this). --------------------------
  private eventActions(event: Event, item: CalendarEvent, action: calendarActions): void  {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    const newItem = this.timesheetList.find((e) => e.uuid === item.id);
    if(!newItem) return;
    if(action === 'Edit'){
      this.actionUpdate(event, newItem);
      document.getElementById("openTimesheetFormBtn")?.click();
    } else if(action === 'View'){
      this.viewTimesheet(event, newItem);
      document.getElementById("timesheetDetailBtn")?.click();
    } else if(action === 'Delete'){
      const isAccess = window.confirm("Are you sure, you want to delete this timesheet?").valueOf();
      if(isAccess) this.trashTimesheet(item.id);
    }
  }

  // Action from timesheet component
  public viewTimesheet(event: Event, item: ITimesheetRes): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectedTimesheet = item;
    this.remarkCtrl.reset();
    this.remarkCtrl.patchValue(this.selectedTimesheet.remark);
  }

  // Common function to use for both componet calendar and table
  public actionUpdate(event: Event, item: ITimesheetRes): void {
    event.stopPropagation();
    this.calendarDate = new Date(item.timesheetDate);
    // this.selectedDate = new Date(item.timesheetDate);
    this.taskFormArray.clear(); // 💡 Clear everything safely
    this.timesheetForm.reset(); // 💡 Reset the form group
    this.timesheetId = item.uuid;
    this.formAction = "Update";
    this.timesheetForm.patchValue(item);
    // Fix: Replace the entire FormArray
    const tasksArray = item.tasks.map(task => this.tasksFormGroup(task));
    this.timesheetForm.setControl('tasks', this._fb.array(tasksArray));
    this.timesheetForm.controls['timesheetDate'].patchValue(this.sharedServ.dateForInput(item.timesheetDate));
  }

  // Request for delete Timesheet
  public requestTrash(event: Event, itemId: string): void {
    if(!event.isTrusted) return;
    event.stopPropagation();
    const isAccess = window.confirm("Are you sure, you want to delete this timesheet?").valueOf();
    if(isAccess) this.trashTimesheet(itemId);
  }

  // Timesheet submit form for update and new
  public submitForm(event: Event): void {
    if(!event.isTrusted) return;
    event.preventDefault();
    event.stopPropagation();
    console.log(this.timesheetForm.value);
    this.timesheetForm.disable();
    const apiSubsc = this.timesheetId.trim() !== '' ? this.timesheetServ.updateTimesheet(this.timesheetId, this.timesheetForm.getRawValue()) : this.timesheetServ.createTimesheet(this.timesheetForm.getRawValue());
    this.apiSubscriber = apiSubsc.subscribe({
      next: (value) => {
        if (value.success) {
          document.getElementById("timesheetFormModalCloseBtn")?.click();
          this.toastr.success(value.message);
          this.timesheetId = "";
          this.timesheetForm.reset();
          this.buildForm();
          if(this.timesheetId == "")
            this.fetchTimesheet();
        }
      },
      error: (err) => {
        this.toastr.error(err.error.error || err.error.message || err.error);
        this.timesheetForm.enable();
      },
    });
  }

  // Update status via admin
  public updateStatus(event: Event, status: TimesheetStatus): void {
    if (!event.isTrusted) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.remarkCtrl.disable();
    const payload = {remark: this.remarkCtrl.value || "", status};
    this.apiSubscriber = this.timesheetServ.updateAdminRemark(this.selectedTimesheet.uuid, payload).subscribe({
      next: (value) => {
        if (value.success) {
          this.toastr.success(value.message);
          const index= this.timesheetList.findIndex(e => e.uuid === this.selectedTimesheet.uuid);
          this.selectedTimesheet.remark = value.data.remark;
          this.selectedTimesheet.status = value.data.status;
          this.selectedTimesheet.isRejected = value.data.isRejected;
          if(index > -1)
            this.timesheetList[index] = this.selectedTimesheet;
        } else {
          this.toastr.error(value.message);
        }
        this.remarkCtrl.enable();
      },
      error: (err) => {
        this.toastr.error(err.error.error || err.error.message || err.message);
        this.remarkCtrl.reset();
        this.remarkCtrl.enable();
      },
    });
  }

  // Call delete timesheet API
  private trashTimesheet(timesheetId: string): void {
    this.timesheetServ.deleteTimesheet(timesheetId).subscribe({
      next: (value) => {
        if(value.success){
          this.toastr.success(value.message);
          this.fetchTimesheet();
        } else {this.toastr.error(value.message);}
      },
      error: (err) => this.toastr.error(err.error.error || err.error.message || err.error),
    });
  }

  // Download timesheet
  public downloadExcel(event: Event): void {
    event.preventDefault();
    this.timesheetServ.downloadMonthExcel({timesheetDate: this.calendarDate, reportType: 'user'}).subscribe({
      next: (value) => {
        this.timesheetServ.excelDownload(value, 'user', this.calendarDate);  
      },
      error: async (err: HttpErrorResponse) => {
        // Check if error is a blob (non-JSON response but likely contains JSON)
        if (err.error instanceof Blob && err.error.type === 'application/json') {
          const text = await err.error.text();
          try {
            const errorJson = JSON.parse(text);
            this.toastr.error(errorJson.error || errorJson.message || 'Download failed.');
          } catch {
            this.toastr.error('Unknown error occurred.');
          }
        } else {
          this.toastr.error(err.error?.message || 'Something went wrong.');
        }
        console.error(err);
        this.toastr.error(err.error.error || err.error.message || err.error);
      },
    });
  }

  public applyFilter(event: Event): void  {
    if(!event.isTrusted) return;
    event.stopPropagation();
    event.preventDefault();
    document.getElementById("filterModalCloseBtn")?.click();
    this.fetchTimesheet();
  }
}
