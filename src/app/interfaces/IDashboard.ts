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