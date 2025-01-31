import { IGeneric } from "./IResponse";

// Define the Leave Day type
export interface ILeaveDay {
    date: Date; // The date of the leave day
    leaveType: leaveType; // Type of leave (half day or full day)
}

// Define the Leave Request Interface
export interface ILeaveRequest {
    employeeId: string; // Employee's unique ID (assuming it's a string)
    orgId: string; // Organization's unique ID
    startDate: ILeaveDay;
    endDate: ILeaveDay;
    reason: string;
    status: leaveStatus; // Leave status
}

export interface ILeaveResponse extends ILeaveRequest, IGeneric{
    leaveDays: ILeaveDay[]; // Array of leave days (half/full days)
    employeeName: string;
    employeePosition: string;
}

export interface ILeaveList {
    docs: Array<ILeaveResponse>;
    total: number;
}

export type leaveStatus = 'pending' | 'approved' | 'rejected';
export type leaveType = 'half_day' | 'full_day';