import { Component, inject, OnDestroy } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { Subscription } from 'rxjs';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { IDashboardMaster, pagination } from '../../interfaces/IResponse';
import { ShareService } from '../../services/share.service';
import { IActivity } from '../../interfaces/IDashboard';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DecimalPipe, KeyValuePipe, DatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnDestroy {
  private adminService = inject(AdminService);
  private dashboardServ = inject(DashboardService);
  public attendanceSummary: Record<string, number> = {};
  public activitis: Array<IActivity> = [];
  public isMoreActivity: boolean = true;
  public isActivityLoaded: boolean = false;
  private activitySkip: number = 0;
  public masterSummary: IDashboardMaster = this.newMsterSummary();
  public isMasterSummaryLoaded: boolean = false;
  private apiSubscriber = new Subscription;

  constructor(){
    this.fetchAttendanceSummary();
    this.fetchMasterSummary();
    this.fetchActivities();
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

  public formatDate(dateStr: Date|string): Date {return new Date(dateStr);}
}
