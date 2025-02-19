import { IGeneric } from "./IResponse";

export interface IAttendance extends IGeneric {
  employeeId: String;
  clockInTime: Date;
  clockOutTime: Date | null;
  status: AttendanceStatus;
  totalHours: number; // Total worked hours in a day
  date: Date;
  employeeName: string;
  employeePosition: string;
}
export type AttendanceStatus = "Present" | "Absent" | "Leave";
export interface IAttendanceList {
  docs: Array<IAttendance>;
  totalCount: number;
}

export interface IRegularizationReq {
  employeeId: String;
  clockInTime: Date;
  clockOutTime: Date;
  attendanceDate: Date;
  reason: string;
}
export interface IRegularizationRes extends IRegularizationReq, IGeneric {
  employeeId: String;
  status: RegularizationStatus;
  employeeDetail: {
    name: string;
    email: string;
    position: string;
  };
}
export type RegularizationStatus = "Pending" | "Approved" | "Rejected";
export interface IRegularizationList {
  docs: Array<IRegularizationRes>;
  totalCount: number;
}

export interface CompressAttendance {
  employeeId: String,
  employeeName: string,
  employeePosition: string,
  date: string,
  status: AttendanceStatus,
  attendance: Array<{
    clockInTime: Date,
    clockOutTime: Date | null,
    totalHours: number,
  }>
}