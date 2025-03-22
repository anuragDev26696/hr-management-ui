import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APIResponse, IDashboardMaster } from '../interfaces/IResponse';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient, private authServ: AuthService) { }

  public getAttendanceSummary(): Observable<APIResponse<Record<string, number>>> {
    return this.http.get<APIResponse<Record<string, number>>>(
      `${environment.api}attendance/today-summary`,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public getMasterSummary(): Observable<APIResponse<IDashboardMaster>> {
    return this.http.get<APIResponse<IDashboardMaster>>(
      `${environment.api}dashboard/admin`,
      {
        headers: this.authServ.header
      }
    );
  }
}
