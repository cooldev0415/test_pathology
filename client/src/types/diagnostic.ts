/**
 * Represents patient information from the pathology report
 */
export interface PatientInfo {
  /** Patient's full name */
  name: string;
  /** Patient's date of birth in YYYY-MM-DD format */
  dob: string;
  /** Patient's gender (M/F) */
  gender: string;
  /** Patient's unique identifier */
  id: string;
}

/**
 * Represents doctor information from the pathology report
 */
export interface DoctorInfo {
  /** Doctor's full name */
  name: string;
  /** Doctor's provider ID */
  providerId: string;
}

/**
 * Represents an abnormal test result
 */
export interface AbnormalResult {
  /** Name of the test */
  testName: string;
  /** The test result value */
  value: string;
  /** Units of measurement */
  units: string;
  /** Reference range for normal values */
  referenceRange: string;
  /** Whether this result indicates high risk */
  isHighRisk: boolean;
}

/**
 * Represents the complete diagnostic result from the pathology report
 */
export interface DiagnosticResult {
  /** Patient information */
  patientInfo: PatientInfo;
  /** Doctor information */
  doctorInfo: DoctorInfo;
  /** List of abnormal test results */
  abnormalResults: AbnormalResult[];
} 