import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { IUserRes } from '../../interfaces/IUser';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RouterLinkWithHref } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, Subscription } from 'rxjs';
import { ToastService } from '../../services/toast.service';
import { LoaderService } from '../../services/loader.service';
import { ShareService } from '../../services/share.service';

@Component({
  selector: 'app-my-profile',
  imports: [DatePipe, TitleCasePipe, RouterLinkWithHref, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit, OnDestroy{
  public employee!: IUserRes;
  public isPending: boolean = true;
  public addressForm: FormGroup = new FormGroup({});
  public profileForm: FormGroup = new FormGroup({});
  public passwordForm: FormGroup = new FormGroup({});
  private auth = inject(AuthService);
  private apiSubscriber = new Subscription;
  public formType: string = "";
  public stateList: Array<any> = [];
  public cityList: Array<any> = [];
  public bloodGroupArray: Array<string> = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  public maxDate: string = "";
  passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/;

  constructor(
    private toast: ToastService,
    private loader: LoaderService,
    private shareServ: ShareService,
  ){
    this.apiSubscriber = this.auth.loggedinUser.subscribe({
      next: (value) => {
        if(value) {
          this.employee = value;
          this.isPending = false; 
          this.buildForms();
        }
      },
    });
    const today = new Date();
    today.setFullYear(today.getFullYear()-18);
    this.maxDate = shareServ.dateForInput(today);
  }

  ngOnInit(): void {
    this.buildForms();
    this.fetchStates();
    this.passwordForm = new FormGroup({
      oldPassword: new FormControl<string|null>({value: '', disabled: false}, [Validators.required]),
      newPassword: new FormControl<string|null>({value: '', disabled: false}, [Validators.required, Validators.pattern(this.passwordRegex), Validators.minLength(8), Validators.maxLength(20)]),
    });
  }

  ngOnDestroy(): void {
    if(this.apiSubscriber)
      this.apiSubscriber.unsubscribe();
  }

  private buildForms(): void {
    this.addressForm = new FormGroup({
      addressLine1: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9 ,.-]+$/)]),
      addressLine2: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(15), Validators.pattern(/^[a-zA-Z0-9 ,.-]+$/)]),
      district: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z ]+$/)]),
      state: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      city: new FormControl<string | null>({value: null, disabled: true}, [Validators.required,]),
      pincode: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.pattern(/^[0-9]{6}$/)]),
    });
    this.profileForm = new FormGroup({
      name: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.minLength(2), Validators.maxLength(35), Validators.pattern(/^[a-zA-Z ]*$/)]),
      personalEmail: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.email, Validators.maxLength(100)]),
      gender: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      bloodGroup: new FormControl<string | null>({value: null, disabled: false}, [Validators.required]),
      maritalStatus: new FormControl<string | null>({value: null, disabled: false}, [Validators.required,]),
      dateOfBirth: new FormControl<string | null>({value: null, disabled: false}, Validators.required),
      facebookUrl: new FormControl<string>({value: '', disabled: false}, Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
      linkedinUrl: new FormControl<string>({value: '', disabled: false},Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
      githubUrl: new FormControl<string>({value: '', disabled: false},Validators.pattern(/^(https?:\/\/)(www\.)?[\w\-]+(\.[\w\-]+)+([\/?#][^\s]*)?$/)),
    });
    if (this.employee) {
      if(this.formType === 'currentAddress'){
        this.addressForm.patchValue(this.employee.currentAddress);
        if(this.employee.currentAddress.state != null){
          this.addressForm.controls['city'].enable();
          this.fetchCity(this.employee.currentAddress.state, true);
        }
      } else if(this.formType === 'permanentAddress'){
        this.addressForm.patchValue(this.employee.permanentAddress);
        if(this.employee.permanentAddress.state != null){
          this.addressForm.controls['city'].enable();
          this.fetchCity(this.employee.permanentAddress.state, true);
        }
      } else {
        this.profileForm.patchValue(this.employee);
        if(this.employee.dateOfBirth != null){
          const dateStr = this.shareServ.dateForInput(new Date(this.employee.dateOfBirth));
          this.profileForm.controls['dateOfBirth'].patchValue(dateStr);
        }
      }
    }
  }

  protected fetchStates(): void {
    this.shareServ.getStates().subscribe({
      next: (value) => {
        if(!value.error && Array.isArray(value.data.states)){
          this.stateList = value.data.states;
        }
      },
    })
  }

  protected fetchCity(state_code: string, isUpdate: boolean = false): void {
    this.shareServ.getCities(state_code).subscribe({
      next: (value) => {
        if(!value.error && Array.isArray(value.data))
          this.cityList = value.data;
        if(isUpdate && this.formType === 'permanentAddress')
          this.addressForm.controls['city'].patchValue(this.employee.permanentAddress.city);
        if(isUpdate && this.formType === 'currentAddress')
          this.addressForm.controls['city'].patchValue(this.employee.currentAddress.city);
      },
    });
  }

  public changeState(event: Event): void {
    if(!event.isTrusted) return;
    const selectItem = event.target as HTMLSelectElement;
    if(selectItem && selectItem.value){
      this.addressForm.controls['state'].patchValue(selectItem.value);
      this.fetchCity(selectItem.value);
      this.addressForm.controls['city'].enable();
      this.addressForm.updateValueAndValidity();
    }
  }
  
  public inputClass(ctrlName: string, isProfileForm: boolean = false): string {
    const ctrl: AbstractControl | null = isProfileForm ? this.profileForm.get(ctrlName) : this.addressForm.get(ctrlName);
    if(!ctrl) return '';
    if(ctrl.valid && ctrl.value != '') return 'is-valid';
    if(ctrl.untouched) return '';
    if(ctrl.touched && ctrl.invalid || ctrl.errors) return 'is-invalid';
    return '';
  }

  public openModal(event: Event, formType: string): void {
    event.stopImmediatePropagation();
    event.preventDefault();
    this.formType = formType;
    this.buildForms();
    if (this.formType === 'currentAddress') {
      this.addressForm.patchValue(this.employee.currentAddress);
    } else if (this.formType === 'permanentAddress') {
      this.addressForm.patchValue(this.employee.permanentAddress);
    }
  }

  protected toggleReset(): void {
    this.addressForm.enable();
    this.addressForm.reset();
    this.addressForm.markAsPristine();
    this.addressForm.updateValueAndValidity();
    
    this.profileForm.enable();
    this.profileForm.reset();
    this.profileForm.markAsPristine();
    this.profileForm.updateValueAndValidity();
  }

  public onSubmit(event: Event): void {
    if(!event.isTrusted) return;
    event.stopImmediatePropagation();
    this.addressForm.disable();
    this.profileForm.disable();
    let data = this.profileForm.value;
    if(this.formType === 'permanentAddress'){
      data = {permanentAddress: this.addressForm.value};
    } else if(this.formType === 'currentAddress'){
      data = {currentAddress: this.addressForm.value};
    }
    this.apiSubscriber = this.auth.updateProfile(data).subscribe({
      next: (value) => {
        this.toast.success(value.message);
        this.employee = value.data;
        this.formType = "";
        this.auth.loggedinUser.next(this.employee);
        document.getElementById('closeProfileModalBtn')?.click();
        document.getElementById('closeModalBtn')?.click();
        this.toggleReset();
      },
      error: (err) => {
        console.log(err, " :error");
        this.toast.error(err.error || err.message);
        this.addressForm.enable();
        this.profileForm.enable();
      },
    });
  }

  public onSubmitPassword(event: Event): void {
    if(!event.isTrusted) return;
    // this.passwordForm.valid;
    document.getElementById('passModalCloseBtn')?.click();
    this.passwordForm.reset();
  }

  public getAddressString(address: Object): string {
    const valuesArray = Object.entries(address).filter(([key]) => key !== "_id").map(([_, value]) => value);
    return valuesArray.join(', ');
  }

}
