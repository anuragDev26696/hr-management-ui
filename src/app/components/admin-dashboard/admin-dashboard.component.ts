import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { Subscription } from 'rxjs';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { IDashboardMaster, pagination } from '../../interfaces/IResponse';
import { ShareService } from '../../services/share.service';
import { IActivity } from '../../interfaces/IDashboard';
import { DashboardService } from '../../services/dashboard.service';
import { IUserRes } from '../../interfaces/IUser';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ToastService } from '../../services/toast.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe, KeyValuePipe, DatePipe, ReactiveFormsModule, EmployeeFormComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private dashboardServ = inject(DashboardService);
  private authServ = inject(AuthService);
  public attendanceSummary: Record<string, number> = {};
  public activitis: Array<IActivity> = [];
  public isMoreActivity: boolean = true;
  public isActivityLoaded: boolean = false;
  public activitySkip: number = 0;
  public masterSummary: IDashboardMaster = this.newMsterSummary();
  public isMasterSummaryLoaded: boolean = false;
  public loggedinUser: IUserRes | null = null;
  requiredReset: boolean = false;
  employeeForm: FormGroup = new FormGroup({});
  private apiSubscriber = new Subscription;

  constructor(
    private shareServ: ShareService,
    private toast: ToastService,
    private loader: LoaderService,
  ){
    this.authServ.loggedinUser.subscribe(res => this.loggedinUser = res);
  }
  
  ngOnInit(): void {
    this.fetchAttendanceSummary();
    this.fetchMasterSummary();
    this.fetchActivities();
    this.buildForm();
  }

  ngOnDestroy(): void {
    if(this.apiSubscriber){
      this.apiSubscriber.unsubscribe();
    }
  }

  private fetchAttendanceSummary(): void{
    this.apiSubscriber = this.adminService.getAttendanceSummary().subscribe({
      next: (value) => {
        this.attendanceSummary = value.data;
      },
    });
  }

  private fetchMasterSummary(): void{
    this.apiSubscriber = this.adminService.getMasterSummary().subscribe({
      next: (value) => {
        this.masterSummary = this.newMsterSummary(value.data);
      },
      complete: () => {
        this.isMasterSummaryLoaded = true
      },
    });
  }

  public refreshSummary(event: Event): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.fetchAttendanceSummary();
  }

  protected newMsterSummary(data: Partial<IDashboardMaster> = {}): IDashboardMaster{
    return {
      totalEmployee: data.totalEmployee ?? 0,
      activeEmployee: data.activeEmployee ?? 0,
      departments: data.departments ?? 0,
      recentRegistrations: data.recentRegistrations ?? 0,
      leaveRequest: data.leaveRequest ?? 0,
    }
  }

  private fetchActivities(): void{
    this.isActivityLoaded = false;
    const newPage: pagination = {skip: this.activitySkip*10, limit: 10};
    this.apiSubscriber = this.dashboardServ.getActivities(newPage, new Date().toISOString()).subscribe({
      next: (value) => {
        if(value.success === true){
          this.activitis = value.data.docs;
          this.isMoreActivity = newPage.skip+10 < value.data.totalCount;
        } else {this.isMoreActivity = false;}
      },
      complete: () => {
        this.isActivityLoaded = true;
      },
    });
  }

  public loadActivities(event: Event, count: number): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    this.activitySkip += count;
    if(this.activitySkip < 0){this.activitySkip = 0};
    this.activitis = [];
    this.fetchActivities();
  }

  public formatDate(dateStr: Date|string): Date {return new Date(dateStr);}

  private buildForm(): void {
    this.employeeForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      email: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.email]),
      mobile: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
      gender: new FormControl<string>({value: 'Male', disabled: false}, Validators.required),
      dateOfBirth: new FormControl<string|null>({value: null, disabled: false}),
      role: new FormControl<string>({value: 'employee', disabled: false}, Validators.required),
      designation: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      position: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      department: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      subDepartment: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      joiningDate: new FormControl<Date | null>({value: null, disabled: false}, [Validators.required]),
      resignationDate: new FormControl<Date| null>({value: null, disabled: false}),
      isActive: new FormControl<boolean>({value: true, disabled: false}, [Validators.required]),
      orgId: new FormControl<string | null>({value: null, disabled: false}),
      permissions: new FormControl<Array<string>>({value: [], disabled: false}),
      currentAddress: this.buildAddressForm,
      permanentAddress: this.buildAddressForm,
    });
  }

  private get buildAddressForm(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z ][0-9]$/)]),
      addressLine2: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z ][0-9]$/)]),
      district: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]$/)]),
      city: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]$/)]),
      pincode: new FormControl<string | null>({value: null, disabled: false}, [Validators.pattern(/^[0-9]{6}$/)]),
    });
  }

  public toggleReset(): void {
    this.requiredReset = true;
    setTimeout(() => {
      this.requiredReset = false;
    }, 1000);
  }

  public onSubmit(event: Event): void {
    this.loader.show('circle', 'Form submitting. Please wait.');
    event.stopImmediatePropagation();
    event.preventDefault();
    let subscriber = this.shareServ.craeteNewUser(this.employeeForm.value);
    subscriber.subscribe({
      next: (value) => {
        this.toast.success(value.message);
        document.getElementById('closeModalBtn')?.click();
        this.toggleReset();
        this.employeeForm.reset();
        this.employeeForm.markAsPristine();
        this.employeeForm.updateValueAndValidity();
        this.buildForm();
        this.loader.hide();
      },
      error: (err) => {
        this.toast.error(err.error || err.message);
        this.loader.hide();
      },
    });
  }
}
