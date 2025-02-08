import { Component } from '@angular/core';
import { AttendanceService } from '../../services/attendance.service';
import { IAttendance } from '../../interfaces/IAttendance';
import { TitleCasePipe } from '@angular/common';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegularizationFormComponent } from '../../components/regularization-form/regularization-form.component';
import { debounceTime } from 'rxjs';
import { pagination } from '../../interfaces/IResponse';

@Component({
  selector: 'app-attendance',
  imports: [TitleCasePipe, ReactiveFormsModule, RegularizationFormComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent {
  totalDocs: Number = 0;
  tableColumns: Array<string> = ["#", "employee", "status"];
  attendanceList: Array<IAttendance> = [];
  attendanceLoaded: boolean = false;
  isNext: boolean = false;
  regularizationForm: FormGroup = new FormGroup({});
  paginate: pagination = {skip: 0, limit: 20};

  constructor(
    private attendanceServ: AttendanceService,
  ){
    this.buildForm();
    this.fetchAttendance();
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

  public fetchAttendance(): void {
    this.attendanceServ.dayAttendance(this.paginate).subscribe({
      next: (value) => {
        console.log(value);
        this.attendanceList = value.data.docs;
        this.isNext = (this.paginate.skip*this.paginate.limit)+this.attendanceList.length < value.data.totalCount ;
        this.attendanceLoaded = true;
      },
      error: (err) => {
        console.log(err, " :List error");
        this.attendanceLoaded = true;
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
}
