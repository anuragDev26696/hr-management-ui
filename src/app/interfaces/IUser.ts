import { IGeneric } from "./IResponse";

export interface IUserReq {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  bloodGroup: string;
  maritalStatus: string;
  personalEmail: string;
  mobile: string;
  orgId: string;
  employeeId: string;
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
  facebookUrl: string;
  linkedinUrl: string;
  githubUrl: string;
}

export interface IAddress {
  addressLine1: string | null,
  addressLine2: string | null,
  city: string | null,
  district: string | null,
  pincode: string | null,
  state: string | null,
  _id: string,
}

export interface IUserRes extends IUserReq, IGeneric {
  formattedJoinDate: string;
  departmentDetail?: {
    name: string,
    code: string,
    subDepartments: [
      {
        name: string,
        code: string,
      }
    ],
    "uuid": "9d38ad34-5a17-4e44-b79e-f8daf896b6f0"
  },
  workingDays: Array<string>
}

export interface IUserList {
  docs: Array<IUserRes>;
  total: number;
}

export const bloodRegEx = /^(A|B|AB|O)[+-]$/;