import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { AdminDashboardComponent } from '../../components/admin-dashboard/admin-dashboard.component';
import { HrDashboardComponent } from '../../components/hr-dashboard/hr-dashboard.component';
import { IAttendance } from '../../interfaces/IAttendance';
import { interval, map, Subscription } from 'rxjs';
import { AttendanceService } from '../../services/attendance.service';

@Component({
  selector: 'app-dashboard',
  imports: [AdminDashboardComponent, HrDashboardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnDestroy {
  auth = inject(AuthService);
  private attendanceServ = inject(AttendanceService);
  public userRole: string = "";
  public clockinData!: IAttendance | null;
  private apiSubscriber = new Subscription;
  timeOut: any;
  public isFetchingClockin = true;
  workingTime: { hours: number, minutes: number, seconds: number } = { hours: 0, minutes: 0, seconds: 0 };
  iconClasses: string[] = [
    'bi-hourglass-bottom',
    'bi-hourglass-split',
    'bi-hourglass-top'
  ];
  iconClass: string = this.iconClasses[0];

  constructor(private cdRef: ChangeDetectorRef){
    const tokenVal = this.auth.currentToken();
    const {token, userId, observeToken} = tokenVal();
    this.auth.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role ?? "";
        if(value != null){
          let hasFetched: boolean = false;
          this.apiSubscriber = this.attendanceServ.lastClockin.subscribe({
            next: (value) => {
              this.clockinData = value;
              if(!value){
                if(this.timeOut) clearInterval(this.timeOut);
                this.workingTime = { hours: 0, minutes: 0, seconds: 0 };
                // Only call fetchLastClockin once
                if (!hasFetched) {
                  hasFetched = true;
                  this.fetchLastClockin();
                }
                return;
              }
              this.isFetchingClockin = false;
              this.updateWorkingTime(value);
            },
          });
        }
      },
    });
    this.apiSubscriber = interval(1000).pipe(
      map(i => this.iconClasses[i % this.iconClasses.length]) // Cycle through icons
    ).subscribe(icon => {
      this.iconClass = icon;
    });
  }

  ngOnDestroy(): void {
    if(this.apiSubscriber)
      this.apiSubscriber.unsubscribe();
  }

  protected fetchLastClockin(): void {
    this.apiSubscriber = this.attendanceServ.latestAttendance().subscribe({
      next: (value) => {
        this.attendanceServ.lastClockin.next(value.data);
      },
      complete: () => {
        this.isFetchingClockin = false;
      },
    });
  }

  // Update working time based on clock-in time
  updateWorkingTime(data: IAttendance | null): void {
    // If there is no clockInTime, or clockOutTime exists (indicating the user has clocked out), stop the interval
    if (data && data.clockInTime) {
      // Start the interval to calculate working time if the user has clocked in
      this.timeOut = setInterval(() => {
        this.workingTime = this.attendanceServ.calculateWorkingTime(data.clockInTime);
        this.cdRef.detectChanges();  // Detect changes to update the UI
      }, 1000);
    } else {
      // If there's no clockInTime, clear the interval and reset working time
      clearInterval(this.timeOut);
      this.workingTime = { hours: 0, minutes: 0, seconds: 0 };
    }
  }
  
  public clockOut(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.apiSubscriber = this.attendanceServ.clockout().subscribe({
      next: (value) => {
        this.clockinData = null;
        this.attendanceServ.lastClockin.next(null);
      },
      error: (err) => {},
    });
  }
  
  public clockin(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.apiSubscriber = this.attendanceServ.clockin().subscribe({
      next: (value) => {
        this.attendanceServ.lastClockin.next(value.data);
      },
      error: (err) => {},
    });
  }
}
