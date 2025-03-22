import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { APIResponse, IDashboardMaster, pagination } from '../interfaces/IResponse';
import { environment } from '../../environments/environment';
import { ActivityAPI } from '../interfaces/IDashboard';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient, private authServ: AuthService) { }

  public getAttendanceSummary(): Observable<APIResponse<Record<string, number>>> {
    return this.http.get<APIResponse<Record<string, number>>>(
      `${environment.api}dashboard/attendance-summary`,
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

  public getActivities(page: pagination, endDate: string, role: string = ""): Observable<APIResponse<ActivityAPI>> {
    return this.http.post<APIResponse<ActivityAPI>>(
      `${environment.api}dashboard/activity-log`,
      {limit: page.limit, skip: page.skip, role, endDate},
      {headers: this.authServ.header},
    );
  }
}
