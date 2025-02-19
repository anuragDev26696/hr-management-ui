import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { APIResponse, pagination } from '../interfaces/IResponse';
import { IUserList, IUserReq, IUserRes } from '../interfaces/IUser';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  constructor(private http: HttpClient, private authServ: AuthService,) { }

  public craeteNewUser(reqData: IUserReq): Observable<APIResponse<IUserRes>> {
    return this.http.post<APIResponse<IUserRes>>(`${environment.api}user`, reqData, {headers: this.authServ.header});
  }

  public updateUser(userId: string, reqData: IUserReq): Observable<APIResponse<IUserRes>> {
    return this.http.patch<APIResponse<IUserRes>>(`${environment.api}user/${userId}`, reqData, {headers: this.authServ.header});
  }

  public deleteUser(userId: string): Observable<APIResponse<any>> {
    return this.http.delete<APIResponse<any>>(`${environment.api}user/${userId}`, {headers: this.authServ.header});
  }

  public getUsers(page: pagination, search_string: string ="", role: string = "", isActive: boolean | null = true): Observable<APIResponse<IUserList>> {
    return this.http.get<APIResponse<IUserList>>(`${environment.api}user?skip=${page.skip}&limit=${page.limit}&role=${role}&isActive=${isActive}&search_string=${search_string}`, {headers: this.authServ.header});
  }

  // Date formating for input box
  public dateForInput(strDate: string | Date): string {
    const dat1 = new Date(strDate);  
    // Fixing the month to be 2 digits
    const year = dat1.getFullYear();
    const month = (dat1.getMonth() + 1).toString().padStart(2, '0'); // Adding +1 to get the correct month
    const day = dat1.getDate().toString().padStart(2, '0'); // Ensuring day has 2 digits
    return `${year}-${month}-${day}`;
  }

  public navAlert(): void {
    // Detecting Back/Forward Navigation (e.g., browser's nav buttons)
    window.addEventListener('popstate', function (event) {
      alert('You clicked the back or forward button!');
    });
  }

  public reloadAlert(): void {
    // Detecting Refresh or leaving the page
    window.addEventListener('beforeunload', function (event) {
      alert('You are refreshing or leaving the page!');
      // Optional: Prevent the browser's default confirmation message
      event.returnValue = ''; // Trigger browser's default warning
    });
  }
}
