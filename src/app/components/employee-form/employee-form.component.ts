import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../services/department.service';
import { DepartmentRes, SubDepartment } from '../../interfaces/IDepartment';
import { debounceTime } from 'rxjs';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-employee-form',
  imports: [ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.scss',
})
export class EmployeeFormComponent implements OnChanges {
  @Input() resetAll: boolean = true;
  parentForm = inject(ControlContainer);
  public departments: Array<DepartmentRes> = [];
  public supDepartments: Array<SubDepartment> = [];
  public departLoaded: boolean = false;
  public get parentController(): FormGroup {return this.parentForm.control as FormGroup;}
  public maxJoinDate: string = '';
  public minResignDate: string = '';
  public todayDate: string = '';

  constructor(private departServ: DepartmentService, private shareServ: ShareService,) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.todayDate = this.shareServ.dateForInput(new Date());
    if (changes['resetAll'].currentValue === true) {
      if (this.joinDateCtrl.valid) {
        this.minResignDate = this.shareServ.dateForInput(this.joinDateCtrl.value);
      } else {
        this.minResignDate = this.todayDate;
      }
      
      if (this.resignDateCtrl.valid) {
        this.maxJoinDate = this.shareServ.dateForInput(this.resignDateCtrl.value);
      } else {
        this.maxJoinDate = this.todayDate;
      }
    }
  }

  ngOnInit(): void {
    this.fetchDepartments();
    this.parentController.controls['department'].valueChanges.subscribe({
      next: (value) => {
        if (value) {
          const index = this.departments.findIndex((item) => item.uuid === value);
          if (index > -1) {
            this.supDepartments = this.departments[index].subDepartments;
          }
        }
      },
    });
    this.parentController.controls['isActive'].valueChanges.pipe(debounceTime(500)).subscribe({
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
        if (this.resignDateCtrl.valid) {
          this.maxJoinDate = this.shareServ.dateForInput(value);
        } else {
          this.maxJoinDate = this.shareServ.dateForInput(new Date());
        }
      },
    });
  }

  public get resignDateCtrl(): AbstractControl { return this.parentController.controls['resignationDate']; }
  public get joinDateCtrl(): AbstractControl { return this.parentController.controls['joiningDate']; }

  private fetchDepartments(): void {
    this.departServ.searchDepartments({skip: 0, limit: 100}).subscribe({
      next: (value) => {
        this.departments = value.data.docs;
        this.departLoaded = true;
      },
      error: (err) => {
        this.departLoaded = true;
      },
    });
  }
}
