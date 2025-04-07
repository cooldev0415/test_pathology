export interface AbnormalResult {
  testName: string;
  value: string;
  units: string;
  referenceRange: string;
  isHighRisk: boolean;
  group: string;
}


export interface DiagnosticResult {
  patientInfo: {
    name: string;
    dob: string;
    gender: string;
    id: string;
  };
  doctorInfo: {
    name: string;
    providerId: string;
  };
  abnormalResults: AbnormalResult[];
} 