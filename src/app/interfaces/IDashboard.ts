import { IGeneric } from "./IResponse";

export interface IActivity extends IGeneric {
  orgId: string;
  role: string;
  action: string;
  module: string;
  details: string;
  userName: string;
}

export interface ActivityAPI {
  docs: Array<IActivity>;
  totalCount: number;
}

export interface DashboardEvents {
  birthdays: Array<{dateOfBirth: Date, name: string}>;
  holidays: {name: string, date: Date, holidayType: string};
}