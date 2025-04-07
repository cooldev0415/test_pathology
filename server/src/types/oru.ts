export interface PatientInfo {
  name: string;
  dob: string;
  gender: string;
  id: string;
}

export interface DoctorInfo {
  name: string;
  providerId: string;
}

export interface ORUResult {
  code: string;
  name: string;
  value: string;
  units: string;
  referenceRange: string;
  abnormalFlag: string;
}

export interface ORUTestGroup {
  name: string;
  results: ORUResult[];
}

export interface ORUData {
  patientInfo: PatientInfo;
  doctorInfo: DoctorInfo;
  testGroups: ORUTestGroup[];
} 