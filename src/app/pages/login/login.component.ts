import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  passwordRegex = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/;
  loginForm = new FormGroup({
    email: new FormControl<string | null>({value: null, disabled: false}, [Validators.required, Validators.email, Validators.minLength(10), Validators.maxLength(100)]),
    password: new FormControl<string>({value: '', disabled: false}, [Validators.required, Validators.pattern(this.passwordRegex), Validators.minLength(8), Validators.maxLength(25)]),
  });
  public showPassword: boolean = false;
  auth = inject(AuthService);
  router = inject(Router);

  constructor(){
    const tokenVal = this.auth.currentToken();
    const {token, userId, observeToken} = tokenVal();
    console.log(tokenVal().token, tokenVal().userId);
    observeToken.subscribe({
      next: (value) => {
        console.info("token value: ", value);
      },
    })
  }

  ngOnInit(): void {
  }
  
  public ngSubmit(event: Event): void {
    if(!event.isTrusted || this.loginForm.invalid) return;
    this.loginForm.disable();
    this.auth.login(this.loginForm.value).subscribe({
      next: (value) => {
        this.loginForm.reset();
        this.loginForm.markAsPristine();
        this.loginForm.updateValueAndValidity();
        this.router.navigate(['home']);
      },
      error: (err) => {
        const {error, message} = err.error;
        if(error && error === 'NO_PASSWORD') {
          this.router.navigate(['set-password']);
        }
        console.log(err.message);
        this.loginForm.enable();
      },
    });
  }
}