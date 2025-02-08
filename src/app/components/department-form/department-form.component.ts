import { Component, inject } from '@angular/core';
import { AbstractControl, ControlContainer, FormArray, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-department-form',
  imports: [ReactiveFormsModule, FormsModule,],
  templateUrl: './department-form.component.html',
  styleUrl: './department-form.component.scss'
})
export class DepartmentFormComponent {
  nameRegx: RegExp = /^[a-zA-Z]+([a-zA-Z0-9 ]*[a-zA-Z0-9]+)*$/;
  departmentForm = inject(ControlContainer);
  public get parentController(): FormGroup {return this.departmentForm.control as FormGroup;}
  public get subDepartmentArray(): FormArray {return this.parentController.controls['subDepartments'] as FormArray;}

  constructor() {}

  public addSubDepartment(): void {
    const subDept = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(this.nameRegx)]),
      code: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z]+[0-9]*$/)]),
      isActive: new FormControl<boolean>({value: true, disabled: false}, Validators.required)
    });
    this.subDepartmentArray.push(subDept);
  }

  public removeSubDepartment(event: Event, index: number) {
    event.stopImmediatePropagation();
    this.subDepartmentArray.removeAt(index);
  }
}
