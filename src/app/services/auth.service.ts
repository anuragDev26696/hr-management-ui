import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PlatformLocation, isPlatformBrowser  } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { APIResponse, ILogin } from '../interfaces/IResponse';
import { IUserRes } from '../interfaces/IUser';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public header: HttpHeaders = new HttpHeaders();
  public fileHeader: HttpHeaders = new HttpHeaders();
  private tokenSub: BehaviorSubject<string> = new BehaviorSubject(""); // Get initial value from localstorage if available
  private userId: BehaviorSubject<string> = new BehaviorSubject('');  // assuming 'userId' might be used elsewhere
  public loggedinUser: BehaviorSubject<IUserRes | null> = new BehaviorSubject<IUserRes | null>(null);

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object,) {
    if (isPlatformBrowser(platformId)) {
      this.tokenSub = new BehaviorSubject(localStorage.getItem('token') || "");
      this.userId = new BehaviorSubject(localStorage.getItem('uuid') || "");
    }
    // Subscribe to variable for getting updated value and set header
    this.tokenSub.subscribe({
      next: (value) => {
        this.header = new HttpHeaders({
          'Content-Type': 'application/json',
          'Authorization': `${value}`
        });
        this.fileHeader = new HttpHeaders({
          // 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Authorization': `${value}`,
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
    return this.http.post<APIResponse<any>>(`${environment.api}auth/setPassword`, req, {headers: this.header});
  }

  public getProfile(): Observable<APIResponse<IUserRes>> {
    this.loggedinUser = new BehaviorSubject<IUserRes | null>(null);
    return this.http.get<APIResponse<IUserRes>>(`${environment.api}user/${this.userId.getValue()}`, {headers: this.header});
  }

  public updateProfile(data: Object): Observable<APIResponse<any>> {
    return this.http.patch<APIResponse<any>>(`${environment.api}user/${this.userId.getValue()}`, data, {headers: this.header});
  }

  public logout(): void {
    this.tokenSub.next('');
    this.userId.next('');
    this.loggedinUser.next(null);
    localStorage.clear();
  }
}