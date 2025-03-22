export interface APIResponse<T> {
    data: T;
    message: string
    success: boolean;
    error: string;
}
export interface ILogin {
    token: string,
    payload: {
        uuid: string,
        email: string,
        createdBy: string,
        role: string,
    }
}
export interface IGeneric {
    isDeleted: boolean;
    createdBy: string;
    uuid: string;
    createdAt: string; // Optional, for when you use timestamps in MongoDB
    updatedAt: string; // Optional, for when you use timestamps in MongoDB
    _id: string | null;
}

export interface pagination {skip: number; limit: number;}

export interface IDashboardMaster {departments: number, totalEmployee: number, activeEmployee: number, recentRegistrations: number, leaveRequest: number}