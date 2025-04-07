import { ORUData } from '../types/oru';
import { DiagnosticResult, AbnormalResult } from '../types/result';
import { DataService } from './dataService';


export class AnalysisService {
  private dataService: DataService;

  constructor(dataService: DataService) {
    this.dataService = dataService;
  }

  public analyzeORUData(oruData: ORUData): DiagnosticResult {
    console.log('Analyzing ORU data:', JSON.stringify(oruData, null, 2));
    
    const abnormalResults: AbnormalResult[] = [];
    
    const patientAge = this.calculateAge(oruData.patientInfo.dob);
    const patientGender = oruData.patientInfo.gender.toUpperCase() as 'M' | 'F';
    
    for (const group of oruData.testGroups) {
      console.log(`Processing test group: ${group.name}`);
      
      for (const result of group.results) {
        console.log(`Processing result: ${result.name} = ${result.value} ${result.units} (${result.abnormalFlag})`);
        
        const diagnosticMetric = this.dataService.getDiagnosticMetric(result.name);
        
        if (diagnosticMetric) {
          const isAbnormal = this.isAbnormalResult(result, diagnosticMetric, patientAge, patientGender);
          const isHighRisk = this.isHighRiskResult(result, diagnosticMetric, patientAge, patientGender);
          
          if (isAbnormal) {
            console.log(`Abnormal result found: ${result.name}`);
            abnormalResults.push({
              testName: result.name,
              value: result.value,
              units: result.units,
              referenceRange: result.referenceRange,
              isHighRisk,
              group: group.name
            });
          }
        }
      }
    }
    
    return {
      patientInfo: oruData.patientInfo,
      doctorInfo: oruData.doctorInfo,
      abnormalResults: abnormalResults
    };
  }

  private calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private isAbnormalResult(
    result: { value: string; abnormalFlag: string },
    metric: any,
    patientAge: number,
    patientGender: 'M' | 'F'
  ): boolean {
    if (metric.min_age && patientAge < metric.min_age) return false;
    if (metric.max_age && patientAge > metric.max_age) return false;
    if (metric.gender && metric.gender !== patientGender) return false;

    // If there's an abnormal flag, use it first
    if (result.abnormalFlag && result.abnormalFlag.trim()) {
      return ['H', 'L', 'A', '*'].includes(result.abnormalFlag.trim());
    }

    // Parse the numeric value
    const numericValue = parseFloat(result.value);
    if (isNaN(numericValue)) return false;

    // Check against Everlab ranges first (if available)
    if (metric.everlab_lower !== undefined && metric.everlab_higher !== undefined) {
      return numericValue < metric.everlab_lower || numericValue > metric.everlab_higher;
    }

    // Fall back to standard ranges
    if (metric.standard_lower !== undefined && metric.standard_higher !== undefined) {
      return numericValue < metric.standard_lower || numericValue > metric.standard_higher;
    }

    return false;
  }

  private isHighRiskResult(
    result: { value: string },
    metric: any,
    patientAge: number,
    patientGender: 'M' | 'F'
  ): boolean {
    if (metric.min_age && patientAge < metric.min_age) return false;
    if (metric.max_age && patientAge > metric.max_age) return false;
    if (metric.gender && metric.gender !== patientGender) return false;

    if (metric.highRisk) {
      const numericValue = parseFloat(result.value);
      if (isNaN(numericValue)) return false;

      // Check against Everlab ranges first
      if (metric.everlab_lower !== undefined && metric.everlab_higher !== undefined) {
        const range = metric.everlab_higher - metric.everlab_lower;
        const deviation = Math.max(
          0,
          numericValue - metric.everlab_higher,
          metric.everlab_lower - numericValue
        );
        return deviation > range * 0.5; // More than 50% outside the range
      }

      // Fall back to standard ranges
      if (metric.standard_lower !== undefined && metric.standard_higher !== undefined) {
        const range = metric.standard_higher - metric.standard_lower;
        const deviation = Math.max(
          0,
          numericValue - metric.standard_higher,
          metric.standard_lower - numericValue
        );
        return deviation > range * 0.5; // More than 50% outside the range
      }
    }

    return false;
  }
} 