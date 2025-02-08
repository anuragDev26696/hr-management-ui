import { Component } from '@angular/core';
import { ShareService } from '../../services/share.service';
import { AuthService } from '../../services/auth.service';
import { pagination } from '../../interfaces/IResponse';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { IUserRes } from '../../interfaces/IUser';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';

@Component({
  selector: 'app-employees',
  imports: [TitleCasePipe, DatePipe, EmployeeFormComponent, ReactiveFormsModule],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {
  userList: Array<IUserRes> = [];
  totalDocs: number = 0;
  isNext: boolean = false;
  listLoaded: boolean = false;
  paginate: pagination = {skip: 0, limit: 20};
  tableColumns: Array<string> = ['sr', 'name', 'role', 'created At', ''];
  employeeForm: FormGroup = new FormGroup({});
  formAction: 'add' | 'update' = 'add';
  employeeId: string = "";
  requiredReset: boolean = false;
  userRole: string = '';

  constructor(private shareServ: ShareService, private authServ: AuthService,){
    authServ.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role || "";
        if (this.userRole !== 'admin') {
          this.tableColumns = ['sr', 'name', 'designation', 'created At'];
        } else { 
          this.tableColumns = ['sr', 'name', 'role', 'created At', ''];
        }
      },
    });
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.buildForm();
  }

  private fetchUsers(): void {
    this.listLoaded = false;
    this.listLoaded = true;
    this.shareServ.getUsers(this.paginate, "").subscribe({
      next: (value) => {
        this.userList = value.data.docs;
        this.totalDocs = value.data.total;
        this.isNext = ((this.paginate.skip+1)*this.paginate.limit)+this.userList.length < this.totalDocs;
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
    this.employeeForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      email: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.email]),
      mobile: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
      gender: new FormControl<string>({value: 'Male', disabled: false}, Validators.required),
      role: new FormControl<string>({value: 'employee', disabled: false}, Validators.required),
      designation: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      position: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      department: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      subDepartment: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      joiningDate: new FormControl<Date | null>({value: null, disabled: false}, [Validators.required]),
      resignationDate: new FormControl<Date| null>({value: null, disabled: false}),
      isActive: new FormControl<boolean>({value: true, disabled: false}, [Validators.required]),
      orgId: new FormControl<string | null>({value: null, disabled: false}),
      currentAddress: this.buildAddressForm,
      permanentAddress: this.buildAddressForm,
    });
  }

  private get buildAddressForm(): FormGroup {
    return new FormGroup({
      addressLine1: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z ][0-9]$/)]),
      addressLine2: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z ][0-9]$/)]),
      district: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]$/)]),
      city: new FormControl<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]$/)]),
      pincode: new FormControl<string | null>({value: null, disabled: false}, [Validators.pattern(/^[0-9]{6}$/)]),
    });
  }

  public strToDate(str: string | Date): Date {return new Date(str);}

  public actionUpdate(event: Event, user: IUserRes): void {
    event.stopImmediatePropagation();
    this.formAction = 'update';
    this.employeeForm.patchValue(user);
    const dateStr = this.shareServ.dateForInput(new Date(user.joiningDate));
    this.employeeForm.controls['joiningDate'].patchValue(dateStr);
    this.employeeId = user.uuid;
    if(user.isActive){
      this.employeeForm.controls['resignationDate'].removeValidators([Validators.required]);
    } else {
      this.employeeForm.controls['resignationDate'].addValidators([Validators.required]);
    }
    this.employeeForm.updateValueAndValidity();
    this.toggleReset();
  }

  public toggleReset(): void {
    this.requiredReset = true;
    setTimeout(() => {
      this.requiredReset = false;
    }, 1000);
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    let subscriber = this.formAction === 'add' ? 
    this.shareServ.craeteNewUser(this.employeeForm.value) : 
    this.shareServ.updateUser(this.employeeId, this.employeeForm.value);
    subscriber.subscribe({
      next: (value) => {
        console.log(value);
        document.getElementById('closeModalBtn')?.click();
        this.paginate.skip = this.formAction === 'add' ? 0 : this.paginate.skip;
        this.formAction = 'add';
        this.employeeId = '';
        this.toggleReset();
        this.employeeForm.reset();
        this.employeeForm.markAsPristine();
        this.employeeForm.updateValueAndValidity();
        this.buildForm();
        this.fetchUsers();
      },
      error: (err) => {
        console.log(err, " :error");
      },
    });
  }

  public requestTrash(event: Event, userId: string): void {
    event.stopImmediatePropagation();
    document.getElementById("clickableItem")?.click();
    const isPermit = window.confirm('Are you sure, you want to delete this User?');
    if(isPermit)
      this.deleteProfile(userId);
  }

  private deleteProfile(userId: string): void {
    this.shareServ.deleteUser(userId).subscribe({
      next: (value) => {
        if(this.userList.length > 2) {
          this.userList = this.userList.filter((item) => item.uuid !== userId);
        } else{
          this.paginate.skip = Math.abs(this.paginate.skip-1);
          this.fetchUsers();
        }
      },
    });
  }
}
