import { Component } from '@angular/core';
import { ILeaveResponse, leaveStatus, leaveType } from '../../interfaces/ILeave';
import { pagination } from '../../interfaces/IResponse';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ShareService } from '../../services/share.service';
import { LeaveService } from '../../services/leave.service';
import { AuthService } from '../../services/auth.service';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { LeaveFormComponent } from '../../components/leave-form/leave-form.component';

@Component({
  selector: 'app-leaves',
  imports: [TitleCasePipe, DatePipe, LeaveFormComponent, ReactiveFormsModule],
  templateUrl: './leaves.component.html',
  styleUrl: './leaves.component.scss'
})
export class LeavesComponent {
  leaveList: Array<ILeaveResponse> = [];
  totalDocs: number = 0;
  isNext: boolean = false;
  listLoaded: boolean = false;
  isAllDisabled: boolean = false;
  paginate: pagination = {skip: 0, limit: 20};
  tableColumns: Array<string> = ['sr', 'name', 'leave_days', 'applied_at', 'status', ''];
  requestForm: FormGroup = new FormGroup({});
  formAction: 'apply' | 'update' = 'apply';
  leaveId: string = "";
  employeeId: string = '';
  selectedLeaves: Array<string> = [];
  userRole: string = '';

  constructor(private shareServ: ShareService, private leaveServ: LeaveService, private authServ: AuthService,){
    const auth = authServ.currentToken();
    this.employeeId = auth().userId;
    this.authServ.loggedinUser.subscribe({
      next: (value) => {
        console.log(value);
        this.userRole = value?.role || '';
        if(this.userRole.trim() !== '') this.fetchRequests();
      },
      complete: () => {
      },
    })
  }
  
  ngOnInit(): void {
    this.buildForm();
  }
  
  private fetchRequests(): void {
    this.listLoaded = false;
    this.leaveServ.getLeaves(this.paginate, this.userRole !== 'admin' ? this.employeeId : "").subscribe({
      next: (value) => {
        this.leaveList = value.data.docs;
        this.totalDocs = value.data.total;
        this.isNext = ((this.paginate.skip+1)*this.paginate.limit)+this.leaveList.length < this.totalDocs;
        this.isAllDisabled = this.leaveList.every((item) => item.status !== 'pending');
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
    this.requestForm = new FormGroup({
      startDate: new FormGroup({
        date: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
        leaveType: new FormControl<leaveType | null>({value: null, disabled: false}, Validators.required),
      }),
      endDate: new FormGroup({
        date: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
        leaveType: new FormControl<leaveType | null>({value: null, disabled: false}, Validators.required),
      }),
      orgId: new FormControl<string | null>({value: null, disabled: false},),
      reason: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(10), Validators.maxLength(500)]),
    });
  }

  public strToDate(str: string | Date): Date {return new Date(str);}
  public leaveDetail(item: ILeaveResponse): {isSame: boolean, totalDays: number} {
    const startTime = new Date(item.startDate.date).getTime();
    const endTime = new Date(item.endDate.date).getTime();
    return {isSame: startTime === endTime, totalDays: item.leaveDays.length};
  }

  public leaveSelection(event: Event, uuid: string) {
    event.stopPropagation();
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    const index = this.selectedLeaves.indexOf(uuid);
    if (input.checked && index < 0) {
      this.selectedLeaves.push(uuid);
    } else if (index > -1) {
      this.selectedLeaves.splice(index, 1);
    }
    console.log(this.selectedLeaves);
  }

  public selectAll(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const input = event.target as HTMLInputElement;
    console.log(input.checked, input.indeterminate);
    if (input.checked) {
      this.selectedLeaves = this.leaveList.map((item) => item.uuid);
    } else {
      this.selectedLeaves = [];
    }
  }
  public get allChecked(): {isSome: boolean, isAll: boolean} {
    const isSome = this.selectedLeaves.length > 0 && this.selectedLeaves.length !== this.leaveList.length;
    const isAll = this.selectedLeaves.length > 0 && this.selectedLeaves.length === this.leaveList.length;
    return {isAll, isSome}
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    let subscriber = this.formAction === 'apply' ? 
    this.leaveServ.createRequest(this.requestForm.value) : 
    this.leaveServ.updateLeave(this.leaveId, this.requestForm.value);
    subscriber.subscribe({
      next: (value) => {
        console.log(value);
        document.getElementById('closeModalBtn')?.click();
        this.paginate.skip = this.formAction === 'apply' ? 0 : this.paginate.skip;
        this.formAction = 'apply';
        this.leaveId = '';
        this.requestForm.reset();
        this.requestForm.markAsPristine();
        this.requestForm.updateValueAndValidity();
        this.buildForm();
        this.fetchRequests();
      },
      error: (err) => {
        console.log(err, " :error");
      },
    });
  }

  public updateStatus(event: Event, uuid: Array<string>, status: 'approve'|'reject'): void {
    event.stopPropagation();
    event.preventDefault();
    if (!event.isTrusted) return;
    this.leaveServ.changeLeaveStatus(uuid, status).subscribe({
      next: (value) => {
        // Instead of calling forEach inside the next handler and repeatedly searching for the matching index (findIndex) to update the status of each leave, we use the reduce method to create a lookup object (updatedLeaves), where the key is the uuid and the value is the status.
        // This improves lookup time from O(n) (when using findIndex) to O(1) for each leave in this.leaveList.
        const updatedLeaves = value.data.reduce((acc: Record<string, leaveStatus>, item) => {
          acc[item.uuid] = item.status;
          return acc;
        }, {});

        this.leaveList.forEach((leave) => {
          if (updatedLeaves[leave.uuid]) {
            leave.status = updatedLeaves[leave.uuid];
          }
        });
        this.selectedLeaves = [];
      },
      error: (err) => {
        console.log(err, ' error');
      },
    });
  }

  public requestTrash(event: Event, leaveId: string): void {
    event.stopImmediatePropagation();
    const isPermit = window.confirm('Are you sure, you want to delete this department?');
    if(isPermit)
      this.cancelRequest(leaveId);
  }

  private cancelRequest(leaveUUID: string): void {
    this.leaveServ.cancelLeave(leaveUUID).subscribe({
      next: (value) => {
        this.paginate.skip = Math.abs(this.paginate.skip-1);
        this.fetchRequests();
        this.selectedLeaves = [];
      },
    });
  }
}
