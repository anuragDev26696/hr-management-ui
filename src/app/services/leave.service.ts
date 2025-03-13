import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ILeaveList, ILeaveRequest, ILeaveResponse, leaveStatus } from '../interfaces/ILeave';
import { Observable } from 'rxjs';
import { APIResponse, pagination } from '../interfaces/IResponse';
import { environment } from '../../environments/environment';
import { IHolidayReq, IHolidayRes } from '../interfaces/IHoliday';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {

  constructor(private http: HttpClient, private authServ: AuthService,) { }

  public createRequest(reqData: ILeaveRequest): Observable<APIResponse<ILeaveResponse>> {
    return this.http.post<APIResponse<ILeaveResponse>>(`${environment.api}leaves/apply-leave`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public updateLeave(leaveUUID: string, reqData: ILeaveRequest): Observable<APIResponse<ILeaveRequest>> {
    return this.http.patch<APIResponse<ILeaveRequest>>(`${environment.api}leaves/${leaveUUID}`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public cancelLeave(leaveUUID: string): Observable<APIResponse<any>> {
    return this.http.delete<APIResponse<any>>(`${environment.api}leaves/cancel/${leaveUUID}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public getLeaves(page: pagination, employeeId: string ="", status: leaveStatus | null = null): Observable<APIResponse<ILeaveList>> {
    return this.http.post<APIResponse<ILeaveList>>(`${environment.api}leaves/filter`,
      {
        skip: page.skip,
        limit: page.limit,
        employeeId,
        status
      },
      {
        headers: this.authServ.header
      }
    );
  }

  public changeLeaveStatus(leaveIds: Array<string>, status: 'approve'| 'reject'): Observable<APIResponse<Array<ILeaveResponse>>> {
    return this.http.post<APIResponse<Array<ILeaveResponse>>>(`${environment.api}leaves/update-leave-status`,
      {
        leaveIds,
        status
      },
      {
        headers: this.authServ.header
      }
    );
  }
  public monthLEaves(month: number, year: number, employeeId: string =""): Observable<APIResponse<ILeaveList>> {
    return this.http.post<APIResponse<ILeaveList>>(`${environment.api}leaves/month-leave`,
      {
        employeeId,
        month,
        year,
      },
      {
        headers: this.authServ.header
      }
    );
  }

  // Holiday's APIs
  public createHoliday(reqData: IHolidayReq): Observable<APIResponse<IHolidayRes>> {
    return this.http.post<APIResponse<IHolidayRes>>(`${environment.api}holidays`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public updateHoliday(itemId: string, reqData: IHolidayReq): Observable<APIResponse<IHolidayReq>> {
    return this.http.patch<APIResponse<IHolidayReq>>(`${environment.api}holidays/${itemId}`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public deleteHoliday(itemId: string): Observable<APIResponse<any>> {
    return this.http.delete<APIResponse<any>>(`${environment.api}holidays/${itemId}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public calendarHolidays(year: number): Observable<APIResponse<Array<IHolidayRes>>> {
    return this.http.get<APIResponse<Array<IHolidayRes>>>(`${environment.api}holidays/year/${year}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public monthEvents(month: number, year: number, employeeId: string =""): Observable<APIResponse<IHolidayRes>> {
    return this.http.get<APIResponse<IHolidayRes>>(`${environment.api}holidays/month-holiday/${month}/${year}`,
      {
        headers: this.authServ.header
      }
    );
  }
}
