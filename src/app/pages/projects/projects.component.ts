import { Component } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AppOptionComponent, MuliSelectComponent } from '../../components/muli-select/muli-select.component';
import { filter, ReplaySubject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LoaderService } from '../../services/loader.service';
import { IProjectMember, IProjectRes, ProjectService } from '../../services/project.service';
import { pagination } from '../../interfaces/IResponse';
import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { IUserRes } from '../../interfaces/IUser';
import { ShareService } from '../../services/share.service';
import { NavigationStart, Router, RouterLinkWithHref } from '@angular/router';
import { ProfileTileModule } from '../../components/profile-tile/profile-tile.module';

@Component({
  selector: 'app-projects',
  imports: [ReactiveFormsModule, DatePipe, AsyncPipe, TitleCasePipe, MuliSelectComponent, AppOptionComponent, ProfileTileModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  projectList: Array<IProjectRes> = [];
  projectData: IProjectRes | null = null;
  totalDocs: number = 0;
  pageSkip: number = 0;
  listLoaded: boolean = false;
  isNext: boolean = false;
  userList: Array<IUserRes> = [];
  userLoaded: boolean = false;
  tableColumns: Array<string> = ['sr', 'name', 'description', ''];
  projectForm: FormGroup = new FormGroup({});
  memberAssignFrom: FormGroup = new FormGroup({});
  searchText: FormControl = new FormControl<string>('');
  userRole: string = "";
  nameRegx: RegExp = /^[a-zA-Z]+([a-zA-Z0-9 ]*[a-zA-Z0-9]+)*$/;
  public filteredHolidayDataSubject = new ReplaySubject<IProjectRes[]>(1);
  public isPermit: boolean = false;
  public today: Date = new Date();
  public projectMembers: Array<IProjectMember> = [];
  public memberLoaded: boolean = false;
  public isMoreMembers: boolean = true;
  private memberSkip: number = 0;

  constructor(
    private authServ: AuthService,
    private projectServ: ProjectService,
    private toastr: ToastService,
    private loader: LoaderService,
    private shareServ: ShareService,
    private router: Router,
  ){
    authServ.loggedinUser.subscribe({
      next: (value) => {
        this.userRole = value?.role || "";
        this.isPermit = (value?.permissions ?? []).includes('project');
      },
    });
    router.events.pipe(filter(event => event instanceof NavigationStart)).subscribe({
      next: (value) => {
        this.destroyOpenModal();
      },
    })
  }

  ngOnInit(): void {
    this.fetchProjects();
    this.buildForm();
  }
  public filterList(event: Event): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.filteredHolidayDataSubject.next(
      this.projectList.filter((item) => 
        item.name.toLocaleLowerCase().includes(this.searchText.value.trim().toLocaleLowerCase())
      )
    );
  }

  protected destroyOpenModal(): void {
    document.getElementById('projectModalCloseBtn')?.click();
    document.getElementById('memberModalCloseBtn')?.click();
    document.getElementById('detailModalCloseBtn')?.click();
  }

  protected requiredMultiSelectValidator = (): ValidatorFn => {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return Array.isArray(value) && value.length < 1 ? { required: true } : null;
    };
  };
  
  private fetchProjects(): void {
    const pagination: pagination = {
      limit: 20,
      skip: this.pageSkip,
    }
    this.listLoaded = false;
    this.projectServ.getProjects(pagination, this.searchText.value).subscribe({
      next: (value) => {
        this.projectList = value.data.docs;
        this.filteredHolidayDataSubject.next(this.projectList);
        this.isNext = (pagination.limit*(pagination.skip+1)) < value.data.totalCount;
        this.listLoaded = true;
      },
      error: (err) => {
        const {status, statusText, error} = err;
        this.listLoaded = true;
      },
    });
  }

  private buildForm(): void {
    this.projectForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(this.nameRegx)]),
      description: new FormControl<string | null>({value: null, disabled: false}, Validators.compose([Validators.required, Validators.minLength(5), Validators.maxLength(1500)])),
    });

    this.memberAssignFrom = new FormGroup({
      projectId: new FormControl<string>({value: this.projectData?.uuid || "", disabled: false}, Validators.required),
      memberIds: new FormControl<string[]>({value: [], disabled: false}, Validators.compose([Validators.required, this.requiredMultiSelectValidator])),
      expiryDate: new FormControl<string>({value: '', disabled: false}, Validators.required),
    });
  }

  private fetchUsers(str: string = ""): void {
    this.userLoaded = false;
    this.shareServ.getUsers({skip: 0, limit: 10}, str).subscribe({
      next: (value) => {
        if (value.success && Array.isArray(value.data.docs)) {
          this.userList = value.data.docs;
        }
      },
      error: (err) => this.userLoaded = true,
      complete: () => this.userLoaded = true,
    })
  }

  public strToDate(str: string | Date): Date {return new Date(str);}
  public get nameCtrl(): AbstractControl {return this.projectForm.controls['name'];}
  public get descriptionCtrl(): AbstractControl {return this.projectForm.controls['description'];}
  public get membershipDate(): AbstractControl {return this.memberAssignFrom.controls['expiryDate'];}
  public isValid(ctrl: AbstractControl): boolean {return ctrl.valid;}

  public actionUpdate(event: Event, item: IProjectRes): void {
    if(!event.isTrusted) return;
    this.projectData = item;
    this.projectForm.patchValue(item);
  }
  public actionForMember(event: Event, item: IProjectRes, action:'update'|'view' = 'update'): void {
    if(!event.isTrusted) return;
    this.projectData = item;
    if (action=='update') {
      this.memberAssignFrom.reset();
      this.buildForm();
    }
    this.memberSkip = 0;
    if(this.userList.length < 1){this.fetchUsers();}
    this.projectMembers = [];
    this.memberLoaded = false;
    this.fetchMemeberList()
  }
  public newForm(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.resetAndRebuild();
  }

  private resetAndRebuild(): void {
    this.projectData = null;
    this.projectForm.reset();
    this.projectForm.updateValueAndValidity();
    this.buildForm();
  }

  public onSubmit(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    if(!event.isTrusted || this.projectForm.disabled || this.projectForm.invalid) return;
    this.projectForm.disable()
    let subscriber = this.projectData === null ? 
    this.projectServ.createPorject(this.projectForm.value) : 
    this.projectServ.updateProject(this.projectData.uuid, this.projectForm.value);
    subscriber.subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        document.getElementById('projectModalCloseBtn')?.click();
        this.projectForm.enable();
        console.log(this.projectData != null, this.projectData, value.data);
        if (this.projectData != null) {
          const index = this.projectList.indexOf(this.projectData);
          if(index > -1){
            this.projectList[index] = value.data;
          } else {
            this.fetchProjects();
          }
        } else {
          this.projectList.unshift(value.data)
        }
        this.resetAndRebuild();
      },
      error: (err) => {
        this.projectForm.enable();
        this.toastr.error(err.error.message || err.error.error || err.error);
      },
    });
  }

  public assignMemebers(event: Event): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    if(!event.isTrusted || this.memberAssignFrom.pending || this.projectData == null || this.memberAssignFrom.invalid) return;
    this.memberAssignFrom.markAsPending()
    this.projectServ.assignMember(this.projectData.uuid, this.memberAssignFrom.value).subscribe({
      next: (value) => {
        if(value.success){
          this.toastr.success(value.message);
          document.getElementById('memberModalCloseBtn')?.click();
          // document.getElementById('detailModalCloseBtn')?.click();
          this.fetchSingleProject();
        }
      },
      error: (err) => {
        // The markAsPristine() method only marks the form as clean (not dirty), but it does not reset the pending state.
        this.memberAssignFrom.markAsTouched();
        this.memberAssignFrom.updateValueAndValidity();
        this.toastr.error(err.error.message || err.error.error || err.error);
      },
    });
  }

  public requestTrash(event: Event, itemId: string): void {
    event.stopImmediatePropagation();
    document.getElementById("clickableItem")?.click();
    const isPermit = window.confirm('Are you sure, you want to delete this project?');
    if(isPermit)
      this.deleteEvent(itemId);
  }

  private deleteEvent(eventId: string): void {
    this.projectServ.deleteProject(eventId).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        if(this.projectList.length > 2) {
          this.projectList = this.projectList.filter((item) => item.uuid !== eventId);
          this.filteredHolidayDataSubject.next(this.projectList);
        } else{
          this.fetchProjects();
        }
      },
      error: (err) => {
        this.toastr.error(err.error.message || err.error.error || err.error);
      },
    });
  }
  public triggerForNew(event: Event): void {
    event.stopImmediatePropagation();
    this.fetchProjects();
  }
  private fetchSingleProject(): void {
    if(this.projectData == null) return;
    this.projectServ.getProjectById(this.projectData.uuid).subscribe({
      next: (value) => {
        if(value.success) {
          this.projectData = value.data;
          const index = this.projectList.findIndex(item => item.uuid === this.projectData?.uuid);
          if(index > -1) this.projectList[index] = value.data;
        }
      },
    })
  }

  private fetchMemeberList(): void {
    if(this.projectData == null) return;
    const page: pagination = {
      skip: this.memberSkip,
      limit: 30
    }
    this.projectServ.getProjectMembers(this.projectData?.uuid, page).subscribe({
      next: (value) => {
        if(value.data != null && Array.isArray(value.data)){
          this.projectMembers = value.data;
          this.isMoreMembers = (page.skip+1)*page.limit < (this.projectData?.members || 0);
        }
      },
      error: (err) => this.memberLoaded = true,
      complete: () => this.memberLoaded = true,
    });
  }

  public trashMember(event: Event, memberId: string): void {
    if (!event.isTrusted || memberId.trim() == '' || this.projectData == null) return;
    const isPermitDel = window.confirm("Are you  sure, you eant to remove this member?").valueOf();
    if(isPermitDel){
      this.isDeleting = true;
      this.projectServ.removeMember(this.projectData.uuid,memberId).subscribe({
        next: (value) => {
          this.toastr.success("Member removed.");
          if(this.projectMembers.length < 2){
            this.memberSkip = 0;
            this.fetchMemeberList();
          } else {
            const index = this.projectMembers.findIndex((item) => item.employeeId === memberId);
            if(index > -1){
              this.projectMembers.splice(index, 1);
            }
          }
          this.isDeleting = false;
        },
        error: (err) => this.isDeleting = false,
        complete: () => this.fetchSingleProject(),
      });
    }
  }
  public isDeleting: boolean = false;
}
