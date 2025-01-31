import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { DepartmentFormComponent } from '../../components/department-form/department-form.component';
import { DepartmentRes } from '../../interfaces/IDepartment';
import { pagination } from '../../interfaces/IResponse';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ShareService } from '../../services/share.service';
import { DepartmentService } from '../../services/department.service';

@Component({
  selector: 'app-departments',
  imports: [TitleCasePipe, DatePipe, DepartmentFormComponent, ReactiveFormsModule],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.scss'
})
export class DepartmentsComponent {
  departmentList: Array<DepartmentRes> = [];
  totalDocs: number = 0;
  isNext: boolean = false;
  listLoaded: boolean = false;
  paginate: pagination = {skip: 0, limit: 20};
  tableColumns: Array<string> = ['sr', 'name', 'sub-departments', 'created At', ''];
  departmentForm: FormGroup = new FormGroup({});
  formAction: 'add' | 'update' = 'add';
  departmentId: string = "";

  constructor(private shareServ: ShareService, private departmentServ: DepartmentService, private authServ: AuthService,){}

  ngOnInit(): void {
    this.fetchDepartments();
    this.buildForm();
  }
  
  private fetchDepartments(): void {
    this.listLoaded = false;
    this.departmentServ.searchDepartments(this.paginate, "").subscribe({
      next: (value) => {
        this.departmentList = value.data.docs;
        this.totalDocs = value.data.total;
        this.isNext = ((this.paginate.skip+1)*this.paginate.limit)+this.departmentList.length < this.totalDocs;
        this.listLoaded = true;
      },
      error: (err) => {
        const {status, statusText, error} = err;
        console.log(error.message, " :Error message");
        this.listLoaded = true;
      },
    });
  }

  private buildForm(): void {
    this.departmentForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      code: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z]+[0-9]*$/)]),
      description: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(400)]),
      subDepartments: new FormArray([this.NewSubdepartment]),
    });
  }

  private get NewSubdepartment(): FormGroup {
    return new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      code: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(10), Validators.pattern(/^[a-zA-Z]+[0-9]*$/)]),
      isActive: new FormControl<boolean>({value: true, disabled: false}, Validators.required)
    });
  }

  public strToDate(str: string | Date): Date {return new Date(str);}
  private get subDepartmentArray(): FormArray {return this.departmentForm.controls['subDepartments'] as FormArray;}

  public actionUpdate(event: Event, department: DepartmentRes): void {
    event.stopImmediatePropagation();
    this.formAction = 'update';
    department.subDepartments.forEach((value, i) => {
      if (i > 0) {
        this.subDepartmentArray.push(this.NewSubdepartment);
      }
    });
    this.departmentForm.patchValue(department);
    this.departmentId = department.uuid;
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    let subscriber = this.formAction === 'add' ? 
    this.departmentServ.createDepartment(this.departmentForm.value) : 
    this.departmentServ.updateDepartment(this.departmentId, this.departmentForm.value);
    subscriber.subscribe({
      next: (value) => {
        console.log(value);
        document.getElementById('closeModalBtn')?.click();
        this.paginate.skip = this.formAction === 'add' ? 0 : this.paginate.skip;
        this.formAction = 'add';
        this.departmentId = '';
        while (this.subDepartmentArray.length > 0) {
          this.subDepartmentArray.removeAt(0);
        }
        this.departmentForm.reset();
        this.departmentForm.markAsPristine();
        this.departmentForm.updateValueAndValidity();
        this.buildForm();
        this.fetchDepartments();
      },
      error: (err) => {
        console.log(err, " :error");
      },
    });
  }

  public requestTrash(event: Event, departId: string): void {
    event.stopImmediatePropagation();
    const isPermit = window.confirm('Are you sure, you want to delete this department?');
    if(isPermit)
      this.deleteDepart(departId);
  }

  private deleteDepart(departId: string): void {
    this.departmentServ.deleteDepartment(departId).subscribe({
      next: (value) => {
        if(this.departmentList.length > 2) {
          this.departmentList = this.departmentList.filter((item) => item.uuid);
        } else{
          this.paginate.skip = Math.abs(this.paginate.skip-1);
          this.fetchDepartments();
        }
      },
    });
  }
}
