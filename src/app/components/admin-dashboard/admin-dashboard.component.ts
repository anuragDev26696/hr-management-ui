import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { IDashboardMaster, pagination } from '../../interfaces/IResponse';
import { ShareService } from '../../services/share.service';
import { IActivity } from '../../interfaces/IDashboard';
import { DashboardService } from '../../services/dashboard.service';
import { IUserRes } from '../../interfaces/IUser';
import { AuthService } from '../../services/auth.service';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';
import { ToastService } from '../../services/toast.service';
import { LoaderService } from '../../services/loader.service';
import { EmployeeService } from '../../services/employee.service';
import { AssignRoleComponent } from '../assign-role/assign-role.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe, KeyValuePipe, DatePipe, ReactiveFormsModule,FormsModule, EmployeeFormComponent, AssignRoleComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private dashboardServ = inject(DashboardService);
  private authServ = inject(AuthService);
  private userService = inject(EmployeeService);
  public attendanceSummary: Record<string, number> = {};
  public activitis: Array<IActivity> = [];
  public isMoreActivity: boolean = true;
  public isActivityLoaded: boolean = false;
  public activitySkip: number = 0;
  public masterSummary: IDashboardMaster = this.newMsterSummary();
  public isMasterSummaryLoaded: boolean = false;
  public loggedinUser: IUserRes | null = null;
  employeeForm: FormGroup = new FormGroup({});
  private apiSubscriber = new Subscription;
  public today = new Date();

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
    this.employeeForm = this.userService.getForm;
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

  public openUserModal(event: Event): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.userService.resetForm();
  }

  public onSubmit(event: Event): void {
    // this.loader.show('circle', 'Form submitting. Please wait.');
    event.stopImmediatePropagation();
    event.preventDefault();
    this.userService.submitForm().subscribe({
      next: (value) => {
        this.toast.success(value.message);
        document.getElementById('empFormCloseBtn')?.click();
      },
      error: (err) => {
        this.toast.error(err.error || err.message);
      },
    });
  }
}
