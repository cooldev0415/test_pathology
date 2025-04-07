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
    
    console.log(`Patient age: ${patientAge}, gender: ${patientGender}`);
    
    for (const group of oruData.testGroups) {
      console.log(`Processing test group: ${group.name}`);
      
      for (const result of group.results) {
        console.log(`Processing result: ${result.name} = ${result.value} ${result.units} (abnormal flag: ${result.abnormalFlag || 'none'})`);
        
        const diagnosticMetric = this.dataService.getDiagnosticMetric(result.name);
        
        if (diagnosticMetric) {
          console.log(`Found diagnostic metric:`, diagnosticMetric);
          
          const isAbnormal = this.isAbnormalResult(result, diagnosticMetric, patientAge, patientGender);
          const isHighRisk = this.isHighRiskResult(result, diagnosticMetric, patientAge, patientGender);
          
          console.log(`Result analysis - isAbnormal: ${isAbnormal}, isHighRisk: ${isHighRisk}`);
          
          if (isAbnormal) {
            console.log(`Adding abnormal result: ${result.name}`);
            abnormalResults.push({
              testName: result.name,
              value: result.value,
              units: result.units,
              referenceRange: result.referenceRange,
              isHighRisk,
              group: group.name
            });
          } else {
            console.log(`Result not marked as abnormal. Checking conditions:`);
            console.log(`- Age check: ${!diagnosticMetric.min_age || patientAge >= diagnosticMetric.min_age}`);
            console.log(`- Gender check: ${!diagnosticMetric.gender || diagnosticMetric.gender === patientGender}`);
            console.log(`- Abnormal flag: ${result.abnormalFlag}`);
            console.log(`- Numeric value: ${parseFloat(result.value)}`);
            console.log(`- Reference ranges:`, {
              everlab: {
                lower: diagnosticMetric.everlab_lower,
                higher: diagnosticMetric.everlab_higher
              },
              standard: {
                lower: diagnosticMetric.standard_lower,
                higher: diagnosticMetric.standard_higher
              }
            });
          }
        } else {
          console.log(`No diagnostic metric found for test: ${result.name}`);
        }
      }
    }
    
    console.log(`Analysis complete. Found ${abnormalResults.length} abnormal results.`);
    
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
    console.log(`Checking if result is abnormal:`, {
      value: result.value,
      abnormalFlag: result.abnormalFlag,
      metric: {
        name: metric.name,
        standard_lower: metric.standard_lower,
        standard_higher: metric.standard_higher,
        everlab_lower: metric.everlab_lower,
        everlab_higher: metric.everlab_higher,
        min_age: metric.min_age,
        max_age: metric.max_age,
        gender: metric.gender
      },
      patientAge,
      patientGender
    });

    if (metric.min_age && patientAge < metric.min_age) {
      console.log('Result not abnormal: patient age below minimum');
      return false;
    }
    if (metric.max_age && patientAge > metric.max_age) {
      console.log('Result not abnormal: patient age above maximum');
      return false;
    }
    if (metric.gender && metric.gender !== patientGender) {
      console.log('Result not abnormal: patient gender does not match');
      return false;
    }

    // If there's an abnormal flag, use it first
    if (result.abnormalFlag && result.abnormalFlag.trim()) {
      const isAbnormal = ['H', 'L', 'A', '*'].includes(result.abnormalFlag.trim());
      console.log(`Checking abnormal flag: ${result.abnormalFlag} -> ${isAbnormal}`);
      return isAbnormal;
    }

    // Parse the numeric value
    const numericValue = parseFloat(result.value);
    if (isNaN(numericValue)) {
      console.log('Result not abnormal: value is not a number');
      return false;
    }

    // Check against Everlab ranges first (if available)
    if (metric.everlab_lower !== undefined && metric.everlab_higher !== undefined) {
      const isAbnormal = numericValue < metric.everlab_lower || numericValue > metric.everlab_higher;
      console.log(`Checking Everlab range: ${metric.everlab_lower}-${metric.everlab_higher} -> ${isAbnormal}`);
      return isAbnormal;
    }

    // Fall back to standard ranges
    if (metric.standard_lower !== undefined && metric.standard_higher !== undefined) {
      const isAbnormal = numericValue < metric.standard_lower || numericValue > metric.standard_higher;
      console.log(`Checking standard range: ${metric.standard_lower}-${metric.standard_higher} -> ${isAbnormal}`);
      return isAbnormal;
    }

    console.log('Result not abnormal: no valid ranges to check against');
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