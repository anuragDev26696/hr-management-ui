import { Component, inject } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-leave-form',
  imports: [ReactiveFormsModule],
  templateUrl: './leave-form.component.html',
  styleUrl: './leave-form.component.scss'
})
export class LeaveFormComponent {
  parentForm = inject(ControlContainer);
  public get leaveForm(): FormGroup {return this.parentForm.control as FormGroup;}

  constructor() {}

}
