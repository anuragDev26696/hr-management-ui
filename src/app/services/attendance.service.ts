import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { APIResponse, pagination } from '../interfaces/IResponse';
import { AttendanceStatus, IAttendance, IAttendanceList, IRegularizationList, IRegularizationReq, IRegularizationRes, RegularizationStatus } from '../interfaces/IAttendance';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  constructor(private http: HttpClient, private authServ: AuthService,) { }

  public clockin(): Observable<APIResponse<IAttendance>> {
    return this.http.post<APIResponse<IAttendance>>(`${environment.api}attendance/clockin`,
      {},
      {
        headers: this.authServ.header
      }
    );
  }
  
  public clockout(): Observable<APIResponse<IAttendance>> {
    return this.http.patch<APIResponse<IAttendance>>(`${environment.api}attendance/clockout`,
      {},
      {
        headers: this.authServ.header
      }
    );
  }
  
  public deleteDepartment(departUUID: string): Observable<APIResponse<any>> {
    return this.http.delete<APIResponse<any>>(`${environment.api}departments/${departUUID}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public dayAttendance(
    page: pagination,
    date: Date = new Date(),
    status: AttendanceStatus | null = null,
  ): Observable<APIResponse<IAttendanceList>> {
    return this.http.get<APIResponse<IAttendanceList>>(
      `${environment.api}attendance/day/${date.toISOString()}?skip=${page.skip}&limit=${page.limit}&status=${status}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public monthAttendance(month: Number, year: Number): Observable<APIResponse<IAttendanceList>> {
    return this.http.get<APIResponse<IAttendanceList>>(`${environment.api}attendance/monthAttendance/${month}/${year}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public newRegularizationRequest(reqData: IRegularizationReq): Observable<APIResponse<IRegularizationReq>> {
    return this.http.post<APIResponse<IRegularizationReq>>(`${environment.api}regularization/create`,
      reqData, 
      {headers: this.authServ.header},
    );
  }
  public getRequestList(page: pagination): Observable<APIResponse<IRegularizationList>> {
    return this.http.get<APIResponse<IRegularizationList>>(`${environment.api}regularization/requests?skip=${page.skip}&limit=${page.limit}`,
      {headers: this.authServ.header},
    );
  }
  public changeStatus(requestId: string, status: RegularizationStatus): Observable<APIResponse<IRegularizationRes>> {
    return this.http.patch<APIResponse<IRegularizationRes>>(`${environment.api}regularization/${requestId}/status`,
      {status},
      {headers: this.authServ.header},
    );
  }
  public deleteRequest(requestId: string): Observable<APIResponse<IRegularizationReq>> {
    return this.http.delete<APIResponse<IRegularizationReq>>(`${environment.api}regularization/${requestId}`,
      {headers: this.authServ.header},
    );
  }
}
