import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { DepartmentRes, SubDepartment } from '../../interfaces/IDepartment';
import { debounceTime } from 'rxjs';
import { ShareService } from '../../services/share.service';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IUserRes } from '../../interfaces/IUser';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule, TitleCasePipe],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnInit, AfterContentChecked {
  employeeForm: FormGroup = new FormGroup({});
  public departments: Array<DepartmentRes> = [];
  public subDepartments: Array<SubDepartment> = [];
  public departLoaded: boolean = false;
  public maxJoinDate: string = '';
  public minResignDate: string = '';
  public todayDate: string = '';
  public permissions: Array<string> = ["payroll", "employee", "leave", "attendance", "holiday", "department"];
  public bloodGroupArray: Array<string> = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  public user: IUserRes | null = null;

  constructor(
    private departServ: DepartmentService,
    private shareServ: ShareService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef,
    private userService: EmployeeService,
  ) {
    auth.loggedinUser.subscribe({
      next: (value) => {
        this.user = value;
      }
    });
    this.employeeForm = userService.getForm;
    userService.formMode$.subscribe({
      next: (value) => {
        if(value === 'add'){
          this.minResignDate = this.todayDate;
          this.maxJoinDate = this.todayDate;
        } else {
          if (this.joinDateCtrl.valid) {
            this.minResignDate = this.shareServ.dateForInput(this.joinDateCtrl.value);
          }
          if (this.resignDateCtrl.value) {
            this.maxJoinDate = this.shareServ.dateForInput(this.resignDateCtrl.value);
          }
        }
      },
    })
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.fetchDepartments();
    this.employeeForm.controls['department'].valueChanges.subscribe({
      next: (value) => {
        if (value) {
          const index = this.departments.findIndex((item) => item.uuid === value);
          if (index > -1) {
            this.subDepartments = this.departments[index].subDepartments.sort((a,b)=>a.name.localeCompare(b.name));
          }
        }
      },
    });
    this.employeeForm.controls['isActive'].valueChanges.pipe(debounceTime(500)).subscribe({
      next: (value) => {
        this.resignDateCtrl.clearValidators();
        if (!value) {
          this.resignDateCtrl.setValidators(Validators.required);
        }
        // Ensure to update validity immediately after setting the validator
        this.resignDateCtrl.updateValueAndValidity();
      },
    });
    this.joinDateCtrl.valueChanges.pipe(debounceTime(300)).subscribe({
      next: (value) => {
        if (this.joinDateCtrl.valid) {
          this.minResignDate = this.shareServ.dateForInput(value);
        } else {
          this.minResignDate = this.shareServ.dateForInput(new Date());
        }
      },
    });
    
    this.resignDateCtrl.valueChanges.pipe(debounceTime(300)).subscribe({
      next: (value) => {
        if (value) {
          this.maxJoinDate = this.shareServ.dateForInput(value);
        } else {
          this.maxJoinDate = this.shareServ.dateForInput(new Date());
        }
      },
    });
    this.isActiveCtrl.valueChanges.subscribe({
      next: (value) => {
        if(value === true){} else {
          this.resignDateCtrl.reset();
          this.employeeForm.updateValueAndValidity();
        }
      },
    })
  }

  public get resignDateCtrl(): AbstractControl { return this.employeeForm.controls['resignationDate']; }
  public get joinDateCtrl(): AbstractControl { return this.employeeForm.controls['joiningDate']; }
  public get isActiveCtrl(): AbstractControl { return this.employeeForm.controls['isActive']; }

  public inputClass(ctrlName: string): string {
    const ctrl: AbstractControl | null = this.employeeForm.get(ctrlName);
    if(!ctrl) return '';
    if(ctrl.valid) return 'is-valid';
    if(ctrl.untouched) return '';
    if(ctrl.touched && ctrl.invalid || ctrl.errors) return 'is-invalid';
    return '';
  }

  private fetchDepartments(): void {
    this.departServ.searchDepartments({skip: 0, limit: 100}).subscribe({
      next: (value) => {
        this.departments = value.data.docs.sort((a,b)=> a.name.localeCompare(b.name));
        this.departLoaded = true;
      },
      error: (err) => {
        this.departLoaded = true;
      },
    });
  }

  public changeRole(event: Event): void {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    if(select.value.trim().toLocaleLowerCase() === 'employee') {
      this.employeeForm.controls['permissions'].patchValue([]);
    }
  }
  public selectPermision(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const permissions: Array<String> = this.employeeForm.controls['permissions'].value ?? [];
    const itemIndex = permissions.indexOf(input.value);
    if(input.checked) {
      if(itemIndex < 0){
        permissions.push(input.value);
        this.employeeForm.controls['permissions'].patchValue(permissions);
      }
    } else {
      if(itemIndex >= 0){
        permissions.splice(itemIndex, 1);
        this.employeeForm.controls['permissions'].patchValue(permissions);
      }
    }
    if(this.employeeForm.untouched && this.employeeForm.valid ) this.employeeForm.markAllAsTouched();
  }
  public isPermit(value: string): boolean {
    const permissions: Array<String> = this.employeeForm.controls['permissions'].value ?? [];
    return permissions.includes(value);
  }
}
