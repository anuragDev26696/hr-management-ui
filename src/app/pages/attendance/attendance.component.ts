import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { CompressAttendance, IAttendance } from '../../interfaces/IAttendance';
import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegularizationFormComponent } from '../../components/regularization-form/regularization-form.component';
import { debounceTime, Observable } from 'rxjs';
import { pagination } from '../../interfaces/IResponse';
import { ShareService } from '../../services/share.service';
import { ProfileTileModule } from "../../components/profile-tile/profile-tile.module";

@Component({
  selector: 'app-attendance',
  imports: [TitleCasePipe, ReactiveFormsModule, RegularizationFormComponent, AsyncPipe, DatePipe, ProfileTileModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent {
  totalDocs: Number = 0;
  tableColumns: Array<string> = ["#", "employee", "clock_in", "working_hours", "status"];
  unStructList: Array<IAttendance> = [];
  attendanceList: Array<CompressAttendance> = [];
  monthAttendance: Array<IAttendance> = [];
  attendanceLoaded: boolean = false;
  clockinLoaded: boolean = false;
  clockinPending: boolean = false;
  isNext: boolean = false;
  regularizationForm: FormGroup = new FormGroup({});
  paginate: pagination = {skip: 0, limit: 20};
  todayStr: string = '';
  todayDateStr: string = '';
  clockinData!: Observable<IAttendance | null>;
  workingTime: { hours: number, minutes: number, seconds: number } = { hours: 0, minutes: 0, seconds: 0 };
  userRole: string = "";
  maxMonthYear: string = "";

  // Use HostListener for beforeunload
  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler(event: Event) {
    // Modern browsers will likely ignore this message, but it's good practice
    event.preventDefault(); // For older browsers
    return this.clockinData ? 'You have unsaved changes. Are you sure you want to leave?' : ''; // Most browsers ignore this now
  }

  // Use HostListener for Ctrl+R (and Cmd+R on Mac)
  @HostListener('window:keydown', ['$event'])
  keyDownHandler(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
      event.preventDefault(); // Prevent default reload
      if (!this.clockinData) { 
        window.location.reload();
      } else {
        const confirmReload = confirm('You have unsaved changes. Are you sure you want to reload?');
        if (confirmReload) {
          window.location.reload(); // Only reload if the user confirms
        }
      }
    }
  }

  constructor(
    private attendanceServ: AttendanceService,
    private cdRef: ChangeDetectorRef,
    private shareServ: ShareService,
  ){
    this.userRole = localStorage.getItem('role') || "";
    this.buildForm();
    this.maxMonthYear = `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2, '0')}`;
    if(this.userRole === 'admin')
      this.fetchAttendance();
    this.clockinData = attendanceServ.lastClockin;
    this.clockinData.subscribe({
      next: (value) => {
        if(!value && !this.clockinLoaded){
          this.fetchLastClockin();
          return;
        } else if(value){
          this.updateWorkingTime(value);
        }
        this.clockinLoaded = true;
      },
    });
    this.fetchMonthData();
    this.todayStr = shareServ.dateForInput(new Date()).substring(0, 7);
    this.todayDateStr = shareServ.dateForInput(new Date()).substring(0, 10);
  }

  public buildForm(): void {
    this.regularizationForm = new FormGroup({
      attendanceDate: new FormControl({value: null, disabled: false}, Validators.required),
      clockInTime: new FormControl({value: null, disabled: true}, Validators.required),
      clockOutTime: new FormControl({value: null, disabled: true}, Validators.required),
      reason: new FormControl({value: null, disabled: false}, [Validators.required, Validators.minLength(20), Validators.maxLength(400)]),
    });
    this.clockinTimeCtrl.valueChanges.pipe(debounceTime(300)).subscribe({
      next: (value) => {
        this.clockOutTimeCtrl.reset();
        if (this.clockinTimeCtrl.valid) {
          this.clockOutTimeCtrl.enable();
          return;
        } else {
          this.clockOutTimeCtrl.disable();
        }
      },
    });
  }

  public fetchAttendance(inputDate: string|Date = new Date()): void {
    this.attendanceServ.dayAttendance(this.paginate, new Date(inputDate)).subscribe({
      next: (value) => {
        this.attendanceList = this.compressData(value.data.docs);
        this.unStructList = value.data.docs;
        this.isNext = (this.paginate.skip*this.paginate.limit)+this.unStructList.length < value.data.totalCount ;
        this.attendanceLoaded = true;
      },
      error: (err) => {
        console.log(err, " :List error");
        this.attendanceLoaded = true;
      },
    });
  }

  protected fetchLastClockin(): void {
    if(this.clockinPending) return;
    this.clockinPending = true;
    this.clockinLoaded = false;
    this.attendanceServ.latestAttendance().subscribe({
      next: (value) => {
        this.attendanceServ.lastClockin.next(value.data);
        this.clockinLoaded = true;
        this.updateWorkingTime(value.data);
        this.clockinPending = false;
      },
      error: (err) => {
        console.log(err, " :List error");
        this.clockinLoaded = true;
        this.clockinPending = false;
      },
    });
  }

  // Update working time based on clock-in time
  updateWorkingTime(data: IAttendance): void {
    if (data && data.clockInTime) {
      setInterval(() => {
        this.workingTime = this.attendanceServ.calculateWorkingTime(data.clockInTime);
        this.cdRef.detectChanges();  // Detect changes to update the UI
      }, 1000);  // Update every second
    }
  }

  private fetchMonthData(dateStr: Date = new Date()): void {
    this.attendanceServ.monthAttendance(dateStr.getFullYear(), dateStr.getMonth()).subscribe({
      next: (value) => {
        this.monthAttendance = value.data;
      },
    });
  }

  private get clockinTimeCtrl(): AbstractControl {return this.regularizationForm.controls['clockInTime'];}
  private get clockOutTimeCtrl(): AbstractControl {return this.regularizationForm.controls['clockOutTime'];}

  public markAttendance(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.attendanceServ.clockin().subscribe({
      next: (value) => {
        this.attendanceServ.lastClockin.next(value.data);
        this.clockinData = this.attendanceServ.lastClockin;
      },
      error: (err) => {
        console.log(err, " :clock in error.");
      },
    });
  }
  public clockOut(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.attendanceServ.clockout().subscribe({
      next: (value) => {
        this.attendanceServ.lastClockin.next(null);
        this.clockinData = this.attendanceServ.lastClockin;
        this.fetchAttendance();
      },
      error: (err) => {
        console.log(err, " :clock in error.");
      },
    });
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    console.log(this.regularizationForm.value);
    this.attendanceServ.newRegularizationRequest(this.regularizationForm.value).subscribe({
      next: (value) => {
        document.getElementById('closeModalBtn')?.click();
        this.regularizationForm.reset();
        this.regularizationForm.markAsPristine();
        this.regularizationForm.updateValueAndValidity();
        this.buildForm();
      },
      error: (err) => {
        console.log(err, " :req error");
      },
    })
  }

  public selectMonth(event: Event): void{
    const input = event.target as HTMLInputElement;
    if(input.value)
      this.fetchMonthData(new Date(input.value));
  }

  public selectDate(event: Event): void {
    if(!event.isTrusted) return;
    const input = event.target as HTMLInputElement;
    this.paginate.skip = 0;
    this.todayDateStr = input.value
  }
  // Group data by employeeId and date
  private compressData(data: Array<IAttendance>): Array<CompressAttendance>{
    const groupedData: { [key: string]: CompressAttendance } = {}; // Use an index signature
    data.forEach((curr) => {
      const date = this.shareServ.dateForInput(curr.date); // Extract date from date string
      const key = `${curr.employeeId}-${date}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          employeeId: curr.employeeId,
          employeeName: curr.employeeName,
          employeePosition: curr.employeePosition,
          date: date,
          status: curr.status,
          attendance: []
        };
      }
      groupedData[key].attendance.push({
        clockInTime: curr.clockInTime,
        clockOutTime: curr.clockOutTime,
        totalHours: curr.totalHours
      });
    });
    return Object.values(groupedData);
  }
  public workingHour(item: CompressAttendance): string {
    const total = item.attendance.reduce((sum, item) => sum+item.totalHours, 0);
    return this.formatInTime(total);
  }
  public formatInTime(total: number): string{
    // Extract whole hours and minutes
    let hours = Math.floor(total); // Whole hours
    let minutes = Math.floor((total - hours) * 60); // Convert fractional part to minutes
    let seconds = Math.floor(((total - hours) * 60 - minutes) * 60); // Convert remaining fraction to seconds
  
    // Format the time as hh:mm:ss
    let formattedTime = 
      String(hours).padStart(2, '0') + ":" + 
      String(minutes).padStart(2, '0') + ":" + 
      String(seconds).padStart(2, '0');
  
    return formattedTime; // Save the formatted time
  }
}
