import { IGeneric } from "./IResponse";

export interface SubDepartment {
  name: string;
  code: string;
  isActive: boolean;
}

export interface DepartmentReq {
  name: string;
  code: string;
  description: string;
  subDepartments: SubDepartment[];
  isActive: boolean;
}

export interface DepartmentRes extends DepartmentReq, IGeneric {}

export interface IDepartmentList {
  docs: Array<DepartmentRes>;
  total: number;
}