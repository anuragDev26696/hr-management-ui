import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, of, tap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IUserReq, IUserRes } from '../interfaces/IUser';
import { ShareService } from './share.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private employeeForm: FormGroup = new FormGroup({});
  // private formValidSubject = new BehaviorSubject<boolean>(false); // ✅ Tracks form validity
  // private isSubmittingSubject = new BehaviorSubject<boolean>(false); // ✅ Tracks form pending response
  private formModeSubject = new BehaviorSubject<'add' | 'edit'>('add'); // ✅ Tracks form validity
  // public formValid$ = this.formValidSubject.asObservable();
  // public isSubmitting$ = this.isSubmittingSubject.asObservable();
  public formMode$ = this.formModeSubject.asObservable();
  private employeeId: string = '';
  
  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private fb: FormBuilder,
    private shareServ: ShareService,
  ) {
    this.createForm();
  }

  private createForm() {
    this.employeeForm = this.fb.group({
      name: this.fb.control<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      email: this.fb.control<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.email]),
      mobile: this.fb.control<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(10), Validators.maxLength(10)]),
      gender: this.fb.control<string>({value: 'Male', disabled: false}, Validators.required),
      bloodGroup: this.fb.control<string>({value: '', disabled: false}),
      role: this.fb.control<string>({value: 'employee', disabled: false}, Validators.required),
      employeeId: this.fb.control<string | null>({value: null, disabled: false}, [Validators.required, Validators.pattern(/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/)]),
      designation: this.fb.control<string | null>({value: null, disabled: false}, Validators.required),
      position: this.fb.control<string | null>({value: null, disabled: false}, Validators.required),
      department: this.fb.control<string | null>({value: null, disabled: false}, Validators.required),
      subDepartment: this.fb.control<string | null>({value: null, disabled: false}, [Validators.required]),
      joiningDate: this.fb.control<Date | null>({value: null, disabled: false}, [Validators.required]),
      resignationDate: this.fb.control<Date| null>({value: null, disabled: false}),
      isActive: this.fb.control<boolean>({value: true, disabled: false}, [Validators.required]),
      orgId: this.fb.control<string | null>({value: null, disabled: false}),
      permissions: this.fb.control<Array<string>>({value: [], disabled: false}),
      facebookUrl: this.fb.control<string>({value: '', disabled: false}, Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
      linkedinUrl: this.fb.control<string>({value: '', disabled: false},Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
      githubUrl: this.fb.control<string>({value: '', disabled: false},Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
      currentAddress: this.buildAddressForm,
      permanentAddress: this.buildAddressForm,
    });

    // Watch for form changes and update validity state
    // this.employeeForm.statusChanges.subscribe(() => {
    //   this.formValidSubject.next(this.employeeForm.valid);
    // });
  }

  private get buildAddressForm(): FormGroup {
    return new FormGroup({
      addressLine1: this.fb.control<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9 ,.-]+$/)]),
      addressLine2: this.fb.control<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9 ,.-]+$/)]),
      district: this.fb.control<string | null>({value: null, disabled: false}, [Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]+$/)]),
      state: this.fb.control<string | null>({value: null, disabled: false}, []),
      city: this.fb.control<string | null>({value: null, disabled: true}, []),
      pincode: this.fb.control<string | null>({value: null, disabled: false}, [Validators.pattern(/^[0-9]{6}$/)]),
    });
  }
  
  // Function for returning private form
  public get getForm(): FormGroup {
    return this.employeeForm;
  }
  // Patch value on update
  public patchForm(user: IUserRes) {
    this.employeeForm.patchValue(user);
    this.formModeSubject.next('edit');
    
    let dateStr = this.shareServ.dateForInput(new Date(user.joiningDate));
    this.employeeForm.controls['joiningDate'].patchValue(dateStr);
    this.employeeId = user.uuid;
    if(user.isActive){
      this.employeeForm.controls['resignationDate'].removeValidators([Validators.required]);
    } else {
      this.employeeForm.controls['resignationDate'].addValidators([Validators.required]);
    }
    if(user.dateOfBirth != null){
      dateStr = this.shareServ.dateForInput(new Date(user.dateOfBirth));
      this.employeeForm.controls['dateOfBirth'].patchValue(dateStr);  
    }
    this.employeeForm.updateValueAndValidity();
  }
  // Reset Form
  public resetForm(): void  {
    this.formModeSubject.next('add');
    this.employeeForm.reset();
    this.employeeForm.patchValue({
      gender: 'Male',
      role: 'employee',
      isActive: true,
    })
    this.employeeForm.updateValueAndValidity();
    // this.formValidSubject.next(false);
  }

  submitForm(): Observable<any> {
    if (!this.employeeForm.valid) return of({ error: 'Invalid form data' });
    // this.isSubmittingSubject.next(true);
    this.employeeForm.disable();
    // Simulate API request
    const apiSubsc = this.formModeSubject.getValue() === 'add' ? this.shareServ.craeteNewUser(this.employeeForm.value) : this.shareServ.updateUser(this.employeeId, this.employeeForm.value);
    return apiSubsc.pipe(
      tap(() => {this.employeeForm.enable();}),
      catchError((error) => {
        // this.isSubmittingSubject.next(false);
        this.employeeForm.enable();
        return throwError(() => error);
      })
    );
  }

}
