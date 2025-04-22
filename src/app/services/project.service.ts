import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { APIResponse, IGeneric, pagination } from '../interfaces/IResponse';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IProjectReq{
  name: string;
  description: string;
}
export interface IProjectRes extends IProjectReq, IGeneric {
  members: number;
}
export interface IProjectListRes<T> {
  docs: Array<T>;
  totalCount: number
}
export interface IProjectMember {
  projectId: string,
  employeeId: string,
  expiryDate: Date,
  orgId: string,
  uuid: string,
  employeeDetail?: {
    name: string,
    email: string,
  }
}

export interface AssignedProject {
  projectId: string,
  employeeId: string,
  expiryDate: Date,
  orgId: string,
  projectDetail: {
    name: string,
    uuid: string,
  }
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private http: HttpClient, private authServ: AuthService,) { }

  public createPorject(reqData: IProjectReq): Observable<APIResponse<IProjectRes>> {
    return this.http.post<APIResponse<IProjectRes>>(`${environment.api}projects/create-new`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public updateProject(projectUUID: string, reqData: IProjectReq): Observable<APIResponse<IProjectRes>> {
    return this.http.patch<APIResponse<IProjectRes>>(`${environment.api}projects/${projectUUID}`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }
  
  public deleteProject(projectUUID: string): Observable<APIResponse<any>> {
    return this.http.delete<APIResponse<any>>(`${environment.api}projects/${projectUUID}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public getProjects(page: pagination, search_string: string =""): Observable<APIResponse<IProjectListRes<IProjectRes>>> {
    return this.http.post<APIResponse<IProjectListRes<IProjectRes>>>(`${environment.api}projects/search`,
      {
        skip: page.skip,
        limit: page.limit,
        search_string,
      },
      {
        headers: this.authServ.header
      }
    );
  }

  public assignMember(projectId: string, reqData: Object): Observable<APIResponse<IProjectListRes<IProjectRes>>> {
    return this.http.post<APIResponse<IProjectListRes<IProjectRes>>>(`${environment.api}projects/assign-member`,
      reqData,
      {
        headers: this.authServ.header
      }
    );
  }

  public removeMember(projectId: string, memberId: string): Observable<APIResponse<IProjectMember>> {
    return this.http.put<APIResponse<IProjectMember>>(`${environment.api}projects/remove-member`,
      {
        projectId, memberId
      },
      {
        headers: this.authServ.header
      }
    );
  }

  public getProjectMembers(projectId: string, page: pagination): Observable<APIResponse<Array<IProjectMember>>> {
    return this.http.get<APIResponse<Array<IProjectMember>>>(`${environment.api}projects/project-members/${projectId}?skip=${page.skip}&limit=${page.limit}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public getProjectMemberCount(projectId: string): Observable<APIResponse<number>> {
    return this.http.get<APIResponse<number>>(`${environment.api}projects/member-count/${projectId}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public getProjectById(projectId: string): Observable<APIResponse<IProjectRes>> {
    return this.http.get<APIResponse<IProjectRes>>(`${environment.api}projects/${projectId}`,
      {
        headers: this.authServ.header
      }
    );
  }

  public getAssignedProject(page: pagination): Observable<APIResponse<IProjectListRes<AssignedProject>>> {
    return this.http.get<APIResponse<IProjectListRes<AssignedProject>>>(`${environment.api}projects/assigned/project?skip=${page.skip}&limit=${page.limit}`,
      {
        headers: this.authServ.header
      }
    );
  }
}
