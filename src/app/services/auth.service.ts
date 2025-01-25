import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlatformLocation, isPlatformBrowser  } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { APIResponse, ILogin } from '../interfaces/IResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private header: HttpHeaders = new HttpHeaders();
  private tokenSub: BehaviorSubject<string> = new BehaviorSubject(""); // Get initial value from localstorage if available
  private userId: BehaviorSubject<string> = new BehaviorSubject('');  // assuming 'userId' might be used elsewhere

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object,) {
    if (isPlatformBrowser(platformId)) {
      this.tokenSub = new BehaviorSubject(localStorage.getItem('token') || "");
    }
    // Subscribe to variable for getting updated value and set header
    this.tokenSub.subscribe({
      next: (value) => {
        this.header = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `${value}`
        });
      },
    });
  }

  // public get currentToken(): string {
  //   return this.userId.getValue();
  // }
  // public get tokenObserv(): Observable<string> {
  //   return this.userId.asObservable();
  // }
  // Closure function for currentToken
  public currentToken() {
    // Define the closure function to access the current token
    return () => {
      // You can access this.userId or this.tokenSub directly within the closure
      return {
        token: this.tokenSub.getValue(),  // Gets current value of token
        userId: this.userId.getValue(),     // Gets current value of userId
        observeToken: this.tokenSub.asObservable(),     // Gets current value of userId
      };
    };
  }

  public login(req: any): Observable<APIResponse<ILogin>> {
    return this.http.post<APIResponse<ILogin>>(`${environment.api}auth/login`, req, {headers: this.header}).pipe(map((value) => {
      this.tokenSub.next(value.data.token);
      this.userId.next(value.data.payload.uuid);
      localStorage.setItem('token', this.tokenSub.value);
      localStorage.setItem('uuid', this.userId.value);
      localStorage.setItem('role', value.data.payload.role);
      return value;
    }));
  }

  public setPassword(req: any): Observable<APIResponse<any>> {
    return this.http.post<APIResponse<any>>(`${environment.api}auth/setPassword`, req, {headers: this.header}).pipe(map((value) => {
      console.log(value);
      this.tokenSub.next('dfaf908asdfa');
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('token', this.tokenSub.value);
        localStorage.setItem('uuid', this.userId.value);
      }
      return value;
    }));
  }
}