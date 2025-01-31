import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { APIResponse, pagination } from '../interfaces/IResponse';
import { Observable } from 'rxjs';
import { DepartmentReq, IDepartmentList } from '../interfaces/IDepartment';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor(private http: HttpClient, private authServ: AuthService,) { }

  public createDepartment(reqData: DepartmentReq): Observable<APIResponse<DepartmentReq>> {
    return this.http.post<APIResponse<DepartmentReq>>(`${environment.api}departments`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public updateDepartment(departUUID: string, reqData: DepartmentReq): Observable<APIResponse<DepartmentReq>> {
    return this.http.patch<APIResponse<DepartmentReq>>(`${environment.api}departments/${departUUID}`,
      reqData,
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

  public searchDepartments(page: pagination, search_string: string ="", isActive: boolean = true): Observable<APIResponse<IDepartmentList>> {
    return this.http.post<APIResponse<IDepartmentList>>(`${environment.api}departments/search`,
      {
        skip: page.skip,
        limit: page.limit,
        search_string,
        isActive
      },
      {
        headers: this.authServ.header
      }
    );
  }
}
