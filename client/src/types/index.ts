/**
 * Represents an abnormal test result in the diagnostic report
 */
export interface AbnormalResult {
  /** Name of the test performed */
  testName: string;
  /** Numerical or textual value of the test result */
  value: string;
  /** Units of measurement for the test */
  units: string;
  /** Normal range for this test */
  referenceRange: string;
  /** Indicates if this result requires immediate attention */
  isHighRisk: boolean;
  /** Group or category of the test */
  group: string;
}

/**
 * Patient information from the diagnostic report
 */
export interface PatientInfo {
  /** Patient's full name */
  name: string;
  /** Patient's date of birth in YYYY-MM-DD format */
  dob: string;
  /** Patient's gender (M/F/Other) */
  gender: string;
  /** Patient's unique identifier */
  id: string;
}

/**
 * Doctor information from the diagnostic report
 */
export interface DoctorInfo {
  /** Doctor's full name including title */
  name: string;
  /** Doctor's provider ID */
  providerId: string;
}

/**
 * Complete diagnostic result including patient, doctor, and test information
 */
export interface DiagnosticResult {
  patientInfo: PatientInfo;
  doctorInfo: DoctorInfo;
  abnormalResults: AbnormalResult[];
}

/**
 * Props for components that handle file processing
 */
export interface FileProcessingProps {
  /** Callback function when file processing starts */
  onProcessingStart: () => void;
  /** Callback function when file is successfully processed */
  onFileProcessed: (results: DiagnosticResult) => void;
  /** Callback function when an error occurs during processing */
  onError: (message: string) => void;
} 