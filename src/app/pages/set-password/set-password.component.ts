import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-set-password',
    imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss'
})
export class SetPasswordComponent {
  passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/;
  setPasswordForm = new FormGroup({
    email: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.email, Validators.minLength(10), Validators.maxLength(100)]),
    password: new FormControl<string>({value: '', disabled: false}, [Validators.required, Validators.pattern(this.passwordRegex), Validators.minLength(8), Validators.maxLength(25)]),
  });
  public showPassword: boolean = false;
  auth = inject(AuthService);
  router = inject(Router);
  private toastr = inject(ToastService);

  constructor(){
    const tokenVal = this.auth.currentToken();
    const {token, userId, observeToken} = tokenVal();
    observeToken.subscribe({
      next: (value) => {
        // console.info("token value: ", value);
      },
    })
  }

  ngOnInit(): void {
  }
  
  public ngSubmit(event: Event): void {
    if(!event.isTrusted || this.setPasswordForm.invalid) return;
    this.setPasswordForm.disable();
    this.auth.setPassword(this.setPasswordForm.value).subscribe({
      next: (value) => {
        this.toastr.success(value.message);
        this.router.navigate(['login']);
      },
      error: (err) => {
        this.setPasswordForm.enable();
        const {error, message} = err.error;
        this.toastr.error(error.error || error.message || message);
        console.log(message);
      },
    });
  }
}