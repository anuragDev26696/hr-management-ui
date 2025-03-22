import { Component, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from '../../services/dashboard.service';
import { IDashboardMaster, pagination } from '../../interfaces/IResponse';
import { IActivity } from '../../interfaces/IDashboard';

@Component({
  selector: 'app-hr-dashboard',
  imports: [],
  templateUrl: './hr-dashboard.component.html',
  styleUrl: './hr-dashboard.component.scss'
})
export class HrDashboardComponent implements OnDestroy {
  private dashboardServ = inject(DashboardService);
  public attendanceSummary: Record<string, number> = {}
  public masterSummary: IDashboardMaster = this.newMsterSummary();
  public isMasterSummaryLoaded: boolean = false;
  public activitySkip: number = 0;
  public activitis: Array<IActivity> = [];
  public isMoreActivity: boolean = true;
  public isActivityLoaded: boolean = false;
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
    this.apiSubscriber = this.dashboardServ.getAttendanceSummary().subscribe({
      next: (value) => {
        this.attendanceSummary = value.data;
        console.log(this.attendanceSummary);
      },
    });
  }

  private fetchMasterSummary(): void{
    this.apiSubscriber = this.dashboardServ.getMasterSummary().subscribe({
      next: (value) => {
        this.masterSummary = this.newMsterSummary(value.data);
      },
      complete: () => {
        this.isMasterSummaryLoaded = true
      },
    });
  }
  
  private fetchActivities(): void{
    this.isActivityLoaded = false;
    const newPage: pagination = {skip: this.activitySkip*10, limit: 10};
    this.apiSubscriber = this.dashboardServ.getActivities(newPage, new Date().toISOString()).subscribe({
      next: (value) => {
        if(value.success === true){
          this.activitis = value.data.docs;
          this.isMoreActivity = newPage.skip+10 < value.data.totalCount;
          this.activitySkip += this.isMoreActivity ? 1 : 0;
        } else {this.isMoreActivity = false;}
      },
      complete: () => {
        this.isActivityLoaded = true;
      },
    });
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
}
