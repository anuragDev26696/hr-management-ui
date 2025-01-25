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