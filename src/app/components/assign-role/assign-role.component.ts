import { TitleCasePipe } from '@angular/common';
import { Component, ElementRef, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { IUserRes } from '../../interfaces/IUser';
import { AppOptionComponent, MuliSelectComponent } from '../muli-select/muli-select.component';
import { ShareService } from '../../services/share.service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-assign-role',
  imports: [ReactiveFormsModule, TitleCasePipe, AppOptionComponent, MuliSelectComponent,],
  templateUrl: './assign-role.component.html',
  styleUrl: './assign-role.component.scss'
})
export class AssignRoleComponent implements OnInit {
  public roleAssignForm: FormGroup = new FormGroup({});
  public permissions: Array<string> = ["payroll", "employee", "leave", "attendance", "holiday", "department"];
  public userList:IUserRes[] = [];
  private searchSubject = new Subject<string>();

  constructor(
    private elementRef: ElementRef,
    private shareServ: ShareService,
  ){
    elementRef.nativeElement.classList.add('modal-content');
  }

  ngOnInit(): void {
    this.buildForm();
    this.fetchUsers();
    this.searchSubject.pipe(debounceTime(700)).subscribe({
      next: (value) => {
        this.fetchUsers(value);
      },
    })
  }

  private buildForm(): void {
    this.roleAssignForm = new FormGroup({
      employeeIds: new FormControl<Array<string>>({value: [], disabled: false}, this.requiredMultiSelectValidator()),
      role: new FormControl<string>({value: '', disabled: false}, Validators.required),
      permissions: new FormControl<Array<string>>({value: [], disabled: false}),
    });
  }
  protected requiredMultiSelectValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (Array.isArray(value) && value.length === 0) {
        return { required: true };
      }
      return null;
    };
  }  

  private fetchUsers(searchText: string = ""): void {
    this.shareServ.getUsers({skip: 0, limit: 10}, searchText).subscribe({
      next: (value) => {
        this.userList = value.data.docs;
      },
    })
  }
  
  public selectUse(event: any): void{console.log(event);}

  public searchUser(event: string): void{this.searchSubject.next(event);}

  public inputClass(ctrlName: string): string {
    const ctrl: AbstractControl | null = this.roleAssignForm.get(ctrlName);
    if(!ctrl) return '';
    if(ctrl.valid) return 'is-valid';
    if(ctrl.untouched) return ctrl.valid ? 'is-valid' : '';
    if(ctrl.touched && ctrl.invalid || ctrl.errors) return 'is-invalid';
    return '';
  }
  public changeRole(event: Event): void {
    event.stopPropagation();
    const select = event.target as HTMLSelectElement;
    if(select.value.trim().toLocaleLowerCase() === 'employee') {
      this.roleAssignForm.controls['permissions'].patchValue([]);
    }
  }
  public selectPermision(event: Event): void {
    event.stopPropagation();
    const input = event.target as HTMLInputElement;
    const permissions: Array<String> = this.roleAssignForm.controls['permissions'].value ?? [];
    const itemIndex = permissions.indexOf(input.value);
    if(input.checked) {
      if(itemIndex < 0){
        permissions.push(input.value);
        this.roleAssignForm.controls['permissions'].patchValue(permissions);
      }
    } else {
      if(itemIndex >= 0){
        permissions.splice(itemIndex, 1);
        this.roleAssignForm.controls['permissions'].patchValue(permissions);
      }
    }
    if(this.roleAssignForm.untouched && this.roleAssignForm.valid ) this.roleAssignForm.markAllAsTouched();
  }
  public isPermit(value: string): boolean {
    const permissions: Array<String> = this.roleAssignForm.controls['permissions'].value ?? [];
    return permissions.includes(value);
  }

  public onSubmit(event:Event): void {}
}
