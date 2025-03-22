import { IGeneric } from "./IResponse";

export interface IHolidayReq{
    date: Date;
    name: string;
    holidayType: IHolidayType;
}
export type IHolidayType = 'Public' | 'Festival' | 'Government';
export  interface IHolidayRes extends IGeneric, IHolidayReq {}