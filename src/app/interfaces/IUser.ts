import { IGeneric } from "./IResponse";

export interface IUserReq {
  name: string;
  email: string;
  gender: string;
  mobile: string;
  orgId: string;
  subDepartment: string;
  department: any;
  isActive: boolean;
  joiningDate: Date;
  role: string;
  jobTitle: boolean;
  designation: string;
  position: string;
  resignationDate: Date | null;
  currentAddress: IAddress;
  permanentAddress: IAddress;
  permissions: Array<string>;
}

export interface IAddress {
  addressLine1: string | null,
  addressLine2: string | null,
  city: string | null,
  district: string | null,
  pincode: string | null,
  _id: string,
}

export interface IUserRes extends IUserReq, IGeneric {
  formattedJoinDate: string;
}

export interface IUserList {
  docs: Array<IUserRes>;
  total: number;
}
