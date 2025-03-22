import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IHolidayRes } from '../../interfaces/IHoliday';
import { ShareService } from '../../services/share.service';
import { AuthService } from '../../services/auth.service';
import { LeaveService } from '../../services/leave.service';
import { ToastService } from '../../services/toast.service';
import { ReplaySubject } from 'rxjs';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-holidays',
  imports: [TitleCasePipe, DatePipe, ReactiveFormsModule, FormsModule, AsyncPipe],
  templateUrl: './holidays.component.html',
  styleUrl: './holidays.component.scss'
})
export class HolidaysComponent {
  holidayList: Array<IHolidayRes> = [];
  holidayData: IHolidayRes | null = null;
  totalDocs: number = 0;
  listLoaded: boolean = false;
  tableColumns: Array<string> = ['sr', 'name', 'type', 'date', ''];
  eventForm: FormGroup = new FormGroup({});
  typeSelectCtrl: string = "";
  formAction: 'add' | 'update' = 'add';
  holidayId: string = "";
  nameRegx: RegExp = /^[a-zA-Z]+([a-zA-Z0-9 ]*[a-zA-Z0-9]+)*$/;
  userRole: string = "";
  view: 'list' | 'grid' = 'list';
  public filteredHolidayDataSubject = new ReplaySubject<IHolidayRes[]>(1);
  public isPermit: boolean = false;
  public today: Date = new Date();
  selectedYear: number = this.today.getFullYear();

  constructor(
    private shareServ: ShareService,
    private holidayServ: LeaveService,
    private authServ: AuthService,
    private toastr: ToastService,
    private loader: LoaderService,
    private cdRef: ChangeDetectorRef,
  ){
    authServ.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role!;
        this.isPermit = (value?.permissions ?? []).includes('employee');
      },
    });
    this.view = window.innerWidth < 576 ? "grid": "list";
    window.addEventListener('resize', (e) => {
      this.view = window.innerWidth < 576 ? "grid": "list";
    });
  }

  ngOnInit(): void {
    this.fetchHolidays();
    this.buildForm();
  }
  public filterList(event: Event): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.filteredHolidayDataSubject.next(
      this.holidayList.filter((item) => 
        item.holidayType.toLocaleLowerCase().includes(this.typeSelectCtrl.trim().toLocaleLowerCase())
      )
    );
  }

  ngAfterViewChecked(): void {
    this.cdRef.detectChanges();  // Trigger manual change detection after view is checked
  }
  
  private fetchHolidays(): void {
    this.listLoaded = false;
    console.log("called api");
    this.holidayServ.calendarHolidays(this.selectedYear).subscribe({
      next: (value) => {
        this.holidayList = value.data;
        this.filteredHolidayDataSubject.next(this.holidayList);
        this.listLoaded = true;
      },
      error: (err) => {
        const {status, statusText, error} = err;
        this.listLoaded = true;
      },
    });
  }

  private buildForm(): void {
    this.eventForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(this.nameRegx)]),
      date: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      holidayType: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(4), Validators.maxLength(20)]),
    });
  }

  public strToDate(str: string | Date): Date {return new Date(str);}
  public get dateCtrl(): AbstractControl {return this.eventForm.controls['date'];}
  public get nameCtrl(): AbstractControl {return this.eventForm.controls['name'];}
  public get holidayTypeCtrl(): AbstractControl {return this.eventForm.controls['holidayType'];}
  public isValid(ctrl: AbstractControl): boolean {return ctrl.valid;}

  public actionUpdate(event: Event, item: IHolidayRes): void {
    event.stopImmediatePropagation();
    this.formAction = 'update';
    this.holidayData = item;
    const formatDate = this.shareServ.dateForInput(item.date);
    this.eventForm.patchValue(item);
    this.eventForm.controls['date'].patchValue(formatDate);
    this.holidayId = item.uuid;
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    let subscriber = this.formAction === 'add' ? 
    this.holidayServ.createHoliday(this.eventForm.value) : 
    this.holidayServ.updateHoliday(this.holidayId, this.eventForm.value);
    subscriber.subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        document.getElementById('closeModalBtn')?.click();
        this.formAction = 'add';
        this.holidayId = '';
        this.eventForm.reset();
        this.eventForm.markAsPristine();
        this.eventForm.updateValueAndValidity();
        this.buildForm();
        this.fetchHolidays();
      },
      error: (err) => {
        this.toastr.error(err.error.message || err.error.error || err.error);
      },
    });
  }

  public requestTrash(event: Event, itemId: string): void {
    event.stopImmediatePropagation();
    document.getElementById("clickableItem")?.click();
    const isPermit = window.confirm('Are you sure, you want to delete this holiday?');
    if(isPermit)
      this.deleteEvent(itemId);
  }

  private deleteEvent(eventId: string): void {
    this.holidayServ.deleteHoliday(eventId).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        if(this.holidayList.length > 2) {
          this.holidayList = this.holidayList.filter((item) => item.uuid !== eventId);
          this.filteredHolidayDataSubject.next(this.holidayList);
        } else{
          this.fetchHolidays();
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message || err.error.error || err.error);
      },
    });
  }
  public isTodayEvent(dateStr: string | Date): boolean {
    const today = new Date();
    const evDate = new Date(dateStr);
    return this.shareServ.dateForInput(today) === this.shareServ.dateForInput(evDate);
  }
  public get yearList(): Array<number> {
    const length = new Date().getFullYear() - 1990;
    return Array.from({length: length}).map((_, index) => new Date().getFullYear()-index);
  }
  public triggerForNew(event: Event): void {
    event.stopImmediatePropagation();
    this.fetchHolidays();
  }
}
