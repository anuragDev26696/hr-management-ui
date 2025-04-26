import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { APIResponse, pagination } from '../interfaces/IResponse';
import { AttendanceStatus, IAttendance, IAttendanceList, IRegularizationList, IRegularizationReq, IRegularizationRes, RegularizationStatus } from '../interfaces/IAttendance';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  lastClockin = new BehaviorSubject<IAttendance | null>(null);

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
    return this.http.put<APIResponse<IAttendance>>(`${environment.api}attendance/clockout`,
      {},
      {
        headers: this.authServ.header
      }
    );
  }
  
  public latestAttendance(): Observable<APIResponse<IAttendance>> {
    return this.http.get<APIResponse<IAttendance>>(`${environment.api}attendance/latest-clockin`,
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
    const params = new HttpParams().set('skip', page.skip).set('limit', page.limit).set('status', status||"");
    return this.http.get<APIResponse<IAttendanceList>>(
      `${environment.api}attendance/day/${date.toISOString()}?skip=${page.skip}&limit=${page.limit}&status=${status}`,
      {
        headers: this.authServ.header, params
      }
    );
  }

  public getAttendanceSummary(): Observable<APIResponse<Record<string, number>>> {
    return this.http.get<APIResponse<Record<string, number>>>(
      `${environment.api}attendance//today-summary`,
      {
        headers: this.authServ.header
      }
    );
  }

  public monthAttendance(month: Number, year: Number): Observable<APIResponse<IAttendance[]>> {
    return this.http.get<APIResponse<IAttendance[]>>(`${environment.api}attendance/month/${month}/${year}`,
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
    const params = new HttpParams().set('skip', page.skip).set('limit', page.limit);
    return this.http.get<APIResponse<IRegularizationList>>(`${environment.api}regularization/requests`,
      {headers: this.authServ.header, params},
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
  public getChartData(chartDate: Date, employeeId: string = ""): Observable<APIResponse<any>> {
    const params = new HttpParams().set('year', chartDate.getFullYear()).set('month', chartDate.getMonth()+1).set('employeeId', employeeId);
    return this.http.get<APIResponse<any>>(`${environment.api}attendance/summary`,
      {headers: this.authServ.header,
        params,
      },
    );
  }
  
  // Method to calculate the working time
  calculateWorkingTime(clockInTime: Date): { hours: number, minutes: number, seconds: number } {
    const currentTime = new Date();
    const differenceInMilliseconds = currentTime.getTime() - new Date(clockInTime).getTime();

    const hours = Math.floor(differenceInMilliseconds / (1000 * 60 * 60)); // Hours
    const minutes = Math.floor((differenceInMilliseconds % (1000 * 60 * 60)) / (1000 * 60)); // Minutes
    const seconds = Math.floor((differenceInMilliseconds % (1000 * 60)) / 1000); // Seconds

    return { hours, minutes, seconds };
  }
}
