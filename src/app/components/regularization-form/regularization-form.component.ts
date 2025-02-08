import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShareService } from '../../services/share.service';
import { debounceTime, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-regularization-form',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './regularization-form.component.html',
  styleUrl: './regularization-form.component.scss'
})
export class RegularizationFormComponent implements OnInit {
  parentForm = inject(ControlContainer);
  maxDate: string = '';
  minOutTime: string = '';
  maxTime: string = '';
  minInTime: string = '';
  maxInTime: string = '';
  constructor(private shareServ: ShareService){
    this.maxDate = shareServ.dateForInput(new Date());
    const today = new Date().setHours(22, 50, 0);
  }

  ngOnInit(): void {
    // Handling Attendance Date Value Changes
    this.buildValidation(this.attendanceDate, this.clockInCtrl);
    // Handling Clock In Time Value Changes
    this.buildValidation(this.clockInCtrl, this.clockOutCtrl, true);
  }

  public get regularizationFrom(): FormGroup {return this.parentForm.control as FormGroup;}
  public get attendanceDate(): AbstractControl { return this.regularizationFrom.controls['attendanceDate']; }
  public get clockInCtrl(): AbstractControl { return this.regularizationFrom.controls['clockInTime']; }
  public get clockOutCtrl(): AbstractControl { return this.regularizationFrom.controls['clockOutTime']; }
  public get reasonCtrl(): AbstractControl { return this.regularizationFrom.controls['reason']; }

  // Generates a date-time string for the input
  public getTimeInputString(dateStr: Date, addExtra: boolean = false): string {
    if (!dateStr || isNaN(dateStr.getTime())) {
      return ''; // Fallback for invalid date input
    }
    const year = dateStr.getFullYear();
    const month = (dateStr.getMonth() + 1).toString().padStart(2, '0');  // Ensure month is two digits
    const date = dateStr.getDate().toString().padStart(2, '0');         // Ensure date is two digits
    const hours = dateStr.getHours().toString().padStart(2, '0');         // Ensure hours is two digits
    const minutes = (dateStr.getMinutes() + (addExtra ? 1 : 0)).toString().padStart(2, '0'); // Ensure minutes is two digits
    this.maxTime = `${year}-${month}-${date}T23:59`;
    this.maxInTime = `${year}-${month}-${date}T22:59`;
    this.minInTime = `${year}-${month}-${date}T00:10`;
    return `${year}-${month}-${date}T${hours}:${minutes}`;
  }

  // Generate reusable function to check validation
  private buildValidation(ctrl: AbstractControl, nextCtrl: AbstractControl, addExtra: boolean = false): void {
    ctrl.valueChanges.pipe(
      debounceTime(300),
      tap(value => {
        // nextCtrl.reset();
        // Reset the next control only if necessary
        if (nextCtrl.disabled) {
          nextCtrl.enable();
        }
        if (ctrl.valid) {
          const newVal = this.getTimeInputString(new Date(value), addExtra);
          this.minOutTime = newVal;
          nextCtrl.patchValue(newVal);
        } else {
          nextCtrl.disable();
        }
      })
    ).subscribe();
  }

  public inputClass(ctrl: AbstractControl): string {
    if(ctrl.valid) return 'is-valid';
    if(ctrl.untouched) return '';
    if(ctrl.touched && ctrl.invalid || ctrl.errors) return 'is-invalid';
    return '';
  }

  public timeKeyPress(event: KeyboardEvent): void {
    if (event.key !== 'Backspace' && event.key !== 'BackSpace') {
      let input = event.target as HTMLInputElement;
      if(input.value && input.value.length == 2){
        input.value += ':';
      }
    } 
  }
}
