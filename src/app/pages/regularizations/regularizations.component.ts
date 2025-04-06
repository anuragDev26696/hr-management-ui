import { Component } from '@angular/core';
import { IRegularizationRes, RegularizationStatus } from '../../interfaces/IAttendance';
import { pagination } from '../../interfaces/IResponse';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShareService } from '../../services/share.service';
import { AuthService } from '../../services/auth.service';
import { AttendanceService } from '../../services/attendance.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { RegularizationFormComponent } from '../../components/regularization-form/regularization-form.component';
import { LoaderService } from '../../services/loader.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-regularizations',
  imports: [ReactiveFormsModule, TitleCasePipe, DatePipe, RegularizationFormComponent],
  templateUrl: './regularizations.component.html',
  styleUrl: './regularizations.component.scss'
})
export class RegularizationsComponent {
  requestList: Array<IRegularizationRes> = [];
  totalDocs: number = 0;
  isNext: boolean = false;
  listLoaded: boolean = false;
  isLoading: boolean = false;
  public isPermit: boolean = false;
  paginate: pagination = {skip: 0, limit: 10};
  tableColumns: Array<string> = ['sr', 'name', 'details', 'created_at', ''];
  userRole: string = '';
  userId: string = '';
  regularizationForm: FormGroup = new FormGroup({});

  constructor(
    private shareServ: ShareService,
    private authServ: AuthService,
    private attendanceServ: AttendanceService,
    private loader: LoaderService,
    private toastr: ToastService,
  ){
    authServ.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role || "";
        this.userId = value?.uuid || "";
        this.isPermit = (value?.permissions || []).includes('attendance') || false;
      },
      complete: () => {
        if(!this.listLoaded && !this.isLoading && this.userId.trim() !== '') {
          this.fetchRequestList();
        }
      },
    });
  }

  ngOnInit(): void {
    this.buildForm();
    this.fetchRequestList();
  }
  
  public buildForm(): void {
    this.regularizationForm = new FormGroup({
      attendanceDate: new FormControl({value: null, disabled: false}, Validators.required),
      clockInTime: new FormControl({value: null, disabled: true}, Validators.required),
      clockOutTime: new FormControl({value: null, disabled: true}, Validators.required),
      reason: new FormControl({value: null, disabled: false}, [Validators.required, Validators.minLength(20), Validators.maxLength(400)]),
    });
  }

  private fetchRequestList(): void {
    this.requestList = [];
    this.isLoading = true;
    this.listLoaded = false;
    this.attendanceServ.getRequestList(this.paginate).subscribe({
      next: (value)=> {
        if (Array.isArray(value.data.docs)) {
          this.requestList = value.data.docs;
          const currentTotal = (this.paginate.skip*this.paginate.limit)+value.data.docs.length;
          this.isNext = currentTotal < value.data.totalCount;
        }
        this.totalDocs = value.data.totalCount;
        this.listLoaded = true;
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  public markAttendance(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.attendanceServ.clockin().subscribe({
      next: (value) => {
        console.log(value, " :clock in val");
      },
      error: (err) => {
        console.log(err, " :clock in error.");
      },
    });
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    if(!event.isTrusted) return;
    this.regularizationForm.disable();
    this.attendanceServ.newRegularizationRequest(this.regularizationForm.value).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        document.getElementById('closeRegularizationModalBtn')?.click();
        this.regularizationForm.enable();
        this.regularizationForm.reset();
        this.regularizationForm.markAsPristine();
        this.regularizationForm.updateValueAndValidity();
        this.buildForm();
        this.paginate.skip = 0;
        this.fetchRequestList();
      },
      error: (err) => {
        this.toastr.error(err.error.error || err.error.message || err.error);
        this.regularizationForm.enable();
        console.log(err.error, " :req error");
      },
    })
  }
  public strToDate(str: string | Date): Date {return new Date(str);}

  public updateStatus(event: Event, uuid: string, status: RegularizationStatus): void {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById("clickableItem")?.click();
    if (!event.isTrusted) return;
    this.attendanceServ.changeStatus(uuid, status).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        this.requestList.forEach((item) => {
          if (item.uuid === uuid) {
            item.status = status;
          }
        });
        this.loader.hide();
      },
      error: (err) => {
        this.toastr.error(err.error.error || err.error.message || err.error);
        this.loader.hide();
      },
    });
  }

  public requestTrash(event: Event, requestUUID: string): void {
    event.stopImmediatePropagation();
    document.getElementById("clickableItem")?.click();
    const isPermit = window.confirm('Are you sure, you want to delete this request?');
    if(isPermit)
      this.cancelRequest(requestUUID);
  }

  private cancelRequest(requestUUID: string): void {
    this.attendanceServ.deleteRequest(requestUUID).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        this.paginate.skip = 0;
        this.fetchRequestList();
      },
      error: (err) => {
        this.toastr.error(err.error.error || err.error.message);
      },
    });
  }
  public loadNext(event: Event, value: number): void {
    event.preventDefault();
    if(!event.isTrusted) return;
    const isValid = (value < 0 && (this.paginate.skip > 0)) || (value > 0 && this.isNext);
    if (isValid) {
      this.paginate.skip += value;
      this.fetchRequestList();
    }
  }
}
