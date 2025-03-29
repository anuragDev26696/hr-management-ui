import { ChangeDetectorRef, Component } from '@angular/core';
import { ShareService } from '../../services/share.service';
import { AuthService } from '../../services/auth.service';
import { pagination } from '../../interfaces/IResponse';
import { DatePipe, NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { IUserRes } from '../../interfaces/IUser';
import { EmployeeFormComponent } from '../../components/employee-form/employee-form.component';
import { ProfileTileModule } from '../../components/profile-tile/profile-tile.module';
import { ToastService } from '../../services/toast.service';
import { LoaderService } from '../../services/loader.service';
import { EmployeeService } from '../../services/employee.service';

@Component({
  selector: 'app-employees',
  imports: [TitleCasePipe, DatePipe, EmployeeFormComponent, ReactiveFormsModule, ProfileTileModule, NgTemplateOutlet],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {
  userList: Array<IUserRes> = [];
  totalDocs: number = 0;
  isNext: boolean = false;
  listLoaded: boolean = false;
  paginate: pagination = {skip: 0, limit: 20};
  tableColumns: Array<string> = ['sr', 'name', 'role', 'created At'];
  employeeForm: FormGroup = new FormGroup({});
  // public formAction: 'add' | 'edit' = 'add'
  public employeeId: string = "";
  public userRole: string = '';
  public filterStatus: null | boolean = null;
  public isPermit: boolean = false;

  constructor(
    private shareServ: ShareService,
    private authServ: AuthService,
    private toast: ToastService,
    private loader: LoaderService,
    private userService: EmployeeService,
  ){
    authServ.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role || "";
        this.isPermit = (value?.permissions ?? []).includes('employee');
        if (this.isPermit) {
          this.tableColumns = ['sr', 'name', 'designation', 'created At', ''];
        }
      },
    });
    this.employeeForm = userService.getForm;
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.employeeForm = this.userService.getForm;
    // this.userService.formValid$.subscribe((value) => this.isFormValid = value);
    // this.userService.isSubmitting$.subscribe((value) => this.isSubmitting = value);
  }

  private fetchUsers(status: null | boolean = null): void {
    this.listLoaded = false;
    this.shareServ.getUsers(this.paginate, "", "", status).subscribe({
      next: (value) => {
        this.userList = value.data.docs;
        this.totalDocs = value.data.total;
        this.isNext = ((this.paginate.skip+1)*this.paginate.limit)+this.userList.length < this.totalDocs;
        this.listLoaded = true;
      },
      error: (err) => {
        const {status, statusText, error} = err;
        this.listLoaded = true;
        this.toast.error(error);
      },
    });
  }

  public openUserModal(event: Event, user: IUserRes | null = null): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.userService.resetForm();
    if(user != null)
      this.userService.patchForm(user); 
  }

  public strToDate(str: string | Date): Date {return new Date(str);}

  public onSubmit(event: Event): void {
    // this.loader.show('circle', 'Form submitting. Please wait.');
    event.stopImmediatePropagation();
    event.preventDefault();
    this.userService.submitForm().subscribe({
      next: (value) => {
        this.toast.success(value.message);
        document.getElementById('closeModalBtn')?.click();
        this.paginate.skip = this.employeeId.trim() === '' ? 0 : this.paginate.skip;
        this.fetchUsers();
        this.employeeId = "";
      },
      error: (err) => {
        console.log(err, " :error");
        this.toast.error(err.error.message || err.message);
      },
    })
  }

  public requestTrash(event: Event, userId: string): void {
    event.stopImmediatePropagation();
    document.getElementById("clickableItem")?.click();
    const isPermit = window.confirm('Are you sure, you want to delete this User?');
    if(isPermit)
      this.deleteProfile(userId);
  }

  private deleteProfile(userId: string): void {
    this.loader.show('circle', 'Deleting');
    this.shareServ.deleteUser(userId).subscribe({
      next: (value) => {
        this.toast.success(value.message);
        if(this.userList.length > 2) {
          this.userList = this.userList.filter((item) => item.uuid !== userId);
        } else{
          this.paginate.skip = Math.abs(this.paginate.skip-1);
          this.fetchUsers();
        }
        this.loader.hide();
      },
      error: (err) => {
        this.toast.error(err.error.error || err.error.message || err.error);
        this.loader.hide();
      },
    });
  }

  public filterByStatus(event: Event, status: null|boolean): void {
    if(!event.isTrusted)return;
    event.stopImmediatePropagation();
    this.listLoaded = false;
    document.getElementById("clickableItem")?.click();
    this.filterStatus = status;
    this.fetchUsers(status);
  }
}
