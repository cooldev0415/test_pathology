import { ORUData, ORUTestGroup, ORUResult, PatientInfo, DoctorInfo } from '../types/oru';
import { DataService } from './dataService';

export class ORUParser {
  private dataService: DataService;

  constructor(dataService: DataService) {
    this.dataService = dataService;
  }

  public parseORU(content: string): ORUData {
    console.log('Parsing ORU content...');
    
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    console.log(`Found ${lines.length} lines to process`);
    
    console.log('First few lines:');
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`Line ${i+1}: ${lines[i].substring(0, 50)}...`);
    }

    let segments: string[] = [];
    if (lines.length === 1) {
      console.log('Single line detected, splitting by segment identifiers');
      // Split by segment identifiers (MSH, PID, ORC, OBR, OBX)
      const segmentRegex = /(MSH|PID|PV1|ORC|OBR|OBX)\|/g;
      const matches = [...lines[0].matchAll(segmentRegex)];
      
      if (matches.length > 0) {
        console.log(`Found ${matches.length} segments in the line`);
        
        // Extract each segment
        for (let i = 0; i < matches.length; i++) {
          const startIndex = matches[i].index;
          const endIndex = i < matches.length - 1 ? matches[i + 1].index : lines[0].length;
          const segment = lines[0].substring(startIndex, endIndex);
          segments.push(segment);
          console.log(`Extracted segment: ${segment.substring(0, 50)}...`);
        }
      } else {
        // If no segments found, try to split by pipe character
        console.log('No segment identifiers found, splitting by pipe character');
        segments = lines[0].split('|').filter(part => part.trim());
      }
    } else {
      segments = lines;
    }

    console.log(`Processing ${segments.length} segments`);

    let patientInfo: PatientInfo | null = null;
    let doctorInfo: DoctorInfo | null = null;
    const testGroups = new Map<string, ORUResult[]>();

    for (const segment of segments) {
      console.log('Processing segment:', segment.substring(0, 100) + '...');
      
      // Extract segment type (first part before pipe)
      const segmentType = segment.split('|')[0];
      console.log(`Segment type: ${segmentType}`);

      switch (segmentType) {
        case 'PID':
          patientInfo = this.parsePatientInfo(segment.split('|'));
          console.log('Found patient info:', patientInfo);
          break;
        case 'ORC':
          doctorInfo = this.parseDoctorInfo(segment.split('|'));
          console.log('Found doctor info:', doctorInfo);
          break;
        case 'OBX':
          const result = this.parseTestResult(segment.split('|'));
          if (result) {
            const groupName = this.getTestGroupName(result.name);
            if (!testGroups.has(groupName)) {
              testGroups.set(groupName, []);
            }
            testGroups.get(groupName)!.push(result);
          }
          break;
      }
    }

    if (!patientInfo) {
      throw new Error('Patient information not found in ORU message');
    }

    if (!doctorInfo) {
      throw new Error('Doctor information not found in ORU message');
    }

    const testGroupsArray: ORUTestGroup[] = Array.from(testGroups.entries()).map(([name, results]) => ({
      name,
      results
    }));

    console.log(`Parsed ${testGroupsArray.length} test groups with ${testGroupsArray.reduce((acc, group) => acc + group.results.length, 0)} total results`);

    return {
      patientInfo,
      doctorInfo,
      testGroups: testGroupsArray
    };
  }


  private parsePatientInfo(segments: string[]): PatientInfo {
    console.log('Parsing PID segment:', segments);
    
    // Extract patient name from PID segment
    // Format: PID|1||394255555^^^NATA&2133&N||SMITH^JOHN^^^DR||19700101|M|||...
    const nameParts = segments[5] ? segments[5].split('^') : [];
    const lastName = nameParts[0] || '';
    const firstName = nameParts[1] || '';
    const name = `${firstName} ${lastName}`.trim();
    
    const dob = segments[7] || '';
    const gender = segments[8] || '';
    const id = segments[3] ? segments[3].split('^')[0] : '';

    console.log(`Extracted patient info: name=${name}, dob=${dob}, gender=${gender}, id=${id}`);

    return {
      name,
      dob: this.formatDate(dob),
      gender,
      id
    };
  }


  private parseDoctorInfo(segments: string[]): DoctorInfo {
    console.log('Parsing ORC segment:', segments);
    
    // Extract doctor name and provider ID from ORC segment
    // Format: ORC|RE||394255555-C-SE-IS^NATA^2133^N||CM|||||||4466067B^SIMPSON^DIDI^^^DR
    const doctorParts = segments[12] ? segments[12].split('^') : [];
    const providerId = doctorParts[0] || '';  // First part is the provider ID
    const doctorLastName = doctorParts[1] || '';
    const doctorFirstName = doctorParts[2] || '';
    const doctorName = `${doctorFirstName} ${doctorLastName}`.trim();

    console.log(`Extracted doctor info: name=${doctorName}, providerId=${providerId}`);

    return {
      name: doctorName,
      providerId
    };
  }

  /**
   * Parse test result from OBX segment
   */
  private parseTestResult(segments: string[]): ORUResult | null {
    console.log('Parsing test result from segments:', segments);

    // Skip non-numeric results
    if (segments[2] !== 'NM') {
      console.log(`Skipping non-numeric result: ${segments[3]}`);
      return null;
    }

    const code = segments[2];
    

    let testName = '';
    const testNameParts = segments[3].split('^');
    console.log('Test name parts:', testNameParts);
    
    // Take the second part as the test name if it exists, otherwise use the first part
    testName = (testNameParts[1] || testNameParts[0]).replace(':', '').trim();
    
    if (testName === 'E.S.R.' || testNameParts[0] === '4537-7') {
      testName = 'E.S.R.';
      console.log('Found E.S.R. test, using exact name for matching');
    }
    
    const value = segments[5];
    const units = segments[6] ? segments[6].split('^')[0] : '';
    const referenceRange = segments[7];
    const abnormalFlag = segments[8];

    console.log('Parsed test result:', {
      code,
      name: testName,
      value,
      units,
      referenceRange,
      abnormalFlag
    });

    return {
      code,
      name: testName,
      value,
      units,
      referenceRange,
      abnormalFlag
    };
  }

  private getTestGroupName(testName: string): string {
    const diagnosticMetric = this.dataService.getDiagnosticMetric(testName);
    
    if (diagnosticMetric) {
      console.log(`Found diagnostic metric for ${testName}: ${diagnosticMetric.name}`);
      
      if (diagnosticMetric.diagnostic_groups) {
        console.log(`Using diagnostic group from metric: ${diagnosticMetric.diagnostic_groups}`);
        return diagnosticMetric.diagnostic_groups;
      }
      
      if (diagnosticMetric.diagnostic) {
        const diagnostic = this.dataService.getDiagnostic(diagnosticMetric.diagnostic);
        if (diagnostic && diagnostic.diagnostic_groups) {
          console.log(`Using diagnostic group from diagnostic: ${diagnostic.diagnostic_groups}`);
          return diagnostic.diagnostic_groups;
        }
      }
      
      if (diagnosticMetric.group) {
        console.log(`Using metric group: ${diagnosticMetric.group}`);
        return diagnosticMetric.group;
      }
    }
    
    // If no match found, use "Other Tests" as a fallback
    console.log(`No match found for ${testName}, using default group: Other Tests`);
    return "Other Tests";
  }

  private formatDate(date: string): string {
    if (date.length !== 8) {
      return date;
    }
    return `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
  }
} 