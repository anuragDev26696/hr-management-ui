import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { APIResponse, IGeneric } from '../interfaces/IResponse';
import { calendarActions, CalendarEvent } from '../components/custom-calendar/calendar.service';
import { endOfDay } from 'date-fns';
import { HourMinutePipe } from '../core/timeFormat.pipe';

export interface ITimesheetReq {
  projectId: string,
  timesheetDate: Date,
  // category: string,
  // subcategory: string,
  tasks: [
    {
      title: string,
      description: string,
      timeTaken: number,
    },
  ],
}

export interface ITimesheetRes extends IGeneric, ITimesheetReq {
  orgId: string,
  timesheetDate: Date,
  timeTaken: number,
  status: TimesheetStatus,
  isRejected: boolean,
  remark: string,
  user: {name: string}
  project: {name: string}
}
export type TimesheetStatus = 'pending' | 'approved' | 'rejected' | 'resubmitted';

interface IListResponse {
  docs: Array<ITimesheetRes>,
  totalCount: number,
}

@Injectable({
  providedIn: 'root'
})
export class TimesheetService {
  constructor(private http: HttpClient, private auth: AuthService ) {}

  public createTimesheet(reqData: ITimesheetReq): Observable<APIResponse<ITimesheetRes>> {
    return this.http.post<APIResponse<ITimesheetRes>>(`${environment.api}timesheet/create-new`, reqData, {headers: this.auth.header});
  }

  public updateTimesheet(timesheetId: string, payload: ITimesheetReq): Observable<APIResponse<ITimesheetRes>> {
    return this.http.patch<APIResponse<ITimesheetRes>>(`${environment.api}timesheet/${timesheetId}`, payload, {headers: this.auth.header});
  }
  
  public deleteTimesheet(timesheetId: string): Observable<APIResponse<ITimesheetRes>> {
    return this.http.delete<APIResponse<ITimesheetRes>>(`${environment.api}timesheet/${timesheetId}`, {headers: this.auth.header});
  }

  public updateAdminRemark(timesheetId: string, payload: { remark: string; status: string }): Observable<APIResponse<ITimesheetRes>> {
    return this.http.patch<APIResponse<ITimesheetRes >>(`${environment.api}timesheet/remark/${timesheetId}`, payload, {headers: this.auth.header});
  }

  public getMonthTimesheet(payload: { reqDate: Date; projectId?: string, employeeId: string }): Observable<APIResponse<IListResponse>> {
    return this.http.post<APIResponse<IListResponse >>(`${environment.api}timesheet/filter/month`, payload, {headers: this.auth.header});
  }

  public downloadMonthExcel(payload: { timesheetDate: Date; reportType: 'project' | 'user', projectId?: string }): Observable<Blob> {
    return this.http.post(`${environment.api}timesheet/download/excel`, payload, {headers: this.auth.fileHeader, responseType: "blob"});
  }

  public excelDownload(blob: Blob, type:string, inputDate: Date): void {
    const a = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = `Timesheet-${type}-${inputDate.toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  public newCalendarEvent(timesheet: ITimesheetRes, actions: (e: Event, event: CalendarEvent, action: calendarActions) => void, hideActions: boolean = false): CalendarEvent{
    const timeFormat = new HourMinutePipe();
    const newEvent: CalendarEvent = {
      id: timesheet.uuid,
      eventActions: actions,
      hideActions,
      showTimes: false,
      title: `${timesheet.user.name} `,
      description: `${timesheet.project.name} - ${timeFormat.transform(timesheet.timeTaken)}`,
      start: new Date(timesheet.timesheetDate),
      end: endOfDay(timesheet.timesheetDate),
      allDay: true,
      color: timesheet.status === 'rejected' ? "#bd0505" : timesheet.status === 'approved' ? '#22bd05' : "#ffaa00",
      type: 'Timesheet',
    };
    return newEvent;
  }
}
