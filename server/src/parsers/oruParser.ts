import { DiagnosticMetric, ORUData, ORUResult, ORUTestGroup } from '../types';
import { DataService } from '../services/dataService';

export class ORUParser {
  constructor(private dataService: DataService) {}

  parseORUFile(content: string): ORUData {
    if (!content) {
      throw new Error('No content provided to parse');
    }

    try {
      // Split content into segments
      const segments = content.split(/(?=MSH\||PID\||PV1\||OBR\||OBX\||ORC\|)/);
      
      // Initialize data
      const data: ORUData = {
        patientInfo: {
          name: '',
          dob: '',
          gender: '',
          id: ''
        },
        doctorInfo: {
          name: '',
          providerId: ''
        },
        testGroups: []
      };

      let currentGroup: ORUTestGroup | null = null;

      // Process each segment
      segments.forEach(segment => {
        if (!segment) return;

        try {
          if (segment.startsWith('MSH|')) {
            // Message header - can extract sending facility if needed
          } else if (segment.startsWith('PID|')) {
            // Patient information
            const pidParts = segment.split('|');
            if (pidParts.length > 5) {
              // Parse patient name from component parts
              const nameParts = (pidParts[5] || '').split('^');
              if (nameParts.length >= 2) {
                // Format: LASTNAME^FIRSTNAME^MIDDLE^SUFFIX^PREFIX
                const lastName = nameParts[0] || '';
                const firstName = nameParts[1] || '';
                const middleName = nameParts[2] || '';
                const suffix = nameParts[3] || '';
                const prefix = nameParts[4] || '';
                
                // Construct formatted name without title
                let formattedName = '';
                // Don't include prefix (title) in patient name
                formattedName += firstName;
                if (middleName) formattedName += ' ' + middleName;
                formattedName += ' ' + lastName;
                if (suffix) formattedName += ' ' + suffix;
                
                data.patientInfo.name = formattedName.trim();
              } else {
                data.patientInfo.name = pidParts[5] || '';
              }

              // Format date of birth from YYYYMMDD to YYYY-MM-DD
              const dob = pidParts[7] || '';
              if (dob.length === 8) {
                data.patientInfo.dob = `${dob.substring(0, 4)}-${dob.substring(4, 6)}-${dob.substring(6, 8)}`;
              } else {
                data.patientInfo.dob = dob;
              }

              data.patientInfo.gender = pidParts[8] || '';
              
              // Parse patient ID
              const idParts = (pidParts[3] || '').split('^');
              data.patientInfo.id = idParts[0] || '';
            }
          } else if (segment.startsWith('PV1|')) {
            // Provider information
            const pv1Parts = segment.split('|');
            
            // Check if we have enough parts in the PV1 segment
            if (pv1Parts.length > 7) {
              // Get the provider information from the 7th field (index 7)
              const providerInfo = pv1Parts[7];
              
              // Check if provider info exists and contains the expected format
              if (providerInfo && providerInfo.includes('^')) {
                // Split the provider info by the caret character
                const providerParts = providerInfo.split('^');
                
                // Check if we have at least the ID and last name
                if (providerParts.length >= 2) {
                  // Extract the provider ID (first part)
                  const providerId = providerParts[0];
                  
                  // Extract the last name (second part)
                  const lastName = providerParts[1];
                  
                  // Extract the first name (third part) if available
                  const firstName = providerParts.length > 2 ? providerParts[2] : '';
                  
                  // Extract the title (fifth part) if available, default to 'Dr'
                  const title = providerParts.length > 4 ? providerParts[4] : 'Dr';
                  
                  // Set the provider ID
                  data.doctorInfo.providerId = providerId;
                  
                  // Format the doctor name with title
                  data.doctorInfo.name = `${title} ${firstName} ${lastName}`.trim();
                }
              }
              
              // If we still don't have doctor info, try the 8th field (index 8)
              if (!data.doctorInfo.name && pv1Parts.length > 8) {
                const alternateProviderInfo = pv1Parts[8];
                if (alternateProviderInfo && alternateProviderInfo.includes('^')) {
                  const providerParts = alternateProviderInfo.split('^');
                  if (providerParts.length >= 2) {
                    const providerId = providerParts[0];
                    const lastName = providerParts[1];
                    const firstName = providerParts.length > 2 ? providerParts[2] : '';
                    const title = providerParts.length > 4 ? providerParts[4] : 'Dr';
                    
                    data.doctorInfo.providerId = providerId;
                    data.doctorInfo.name = `${title} ${firstName} ${lastName}`.trim();
                  }
                }
              }
            }
          } else if (segment.startsWith('OBR|')) {
            // New test group
            const obrParts = segment.split('|');
            currentGroup = {
              name: obrParts[4] || '',
              results: []
            };
            data.testGroups.push(currentGroup);
          } else if (segment.startsWith('OBX|') && currentGroup) {
            // Test result
            const obxParts = segment.split('|');
            if (obxParts.length > 5) {
              try {
                // Parse the code and name from the identifier field
                const identifierParts = (obxParts[3] || '').split('^');
                const code = identifierParts[0] || '';
                const defaultName = identifierParts[1] || '';
                
                const value = obxParts[5] || '';
                let units = obxParts[6] || '';
                const referenceRange = obxParts[7] || '';
                const abnormalFlag = obxParts[8] || '';

                // Normalize common unit variations
                units = this.normalizeUnit(units);

                // Special handling for ESR test
                if (code === '4537-7' || defaultName.includes('E.S.R.') || defaultName.includes('ESR')) {
                  units = 'mm/hr';  // Force correct units for ESR
                }

                // Find matching diagnostic metric for standardization
                const metric = this.findMatchingMetric(code, defaultName, units);
                
                const result: ORUResult = {
                  code: code,
                  name: metric?.name || defaultName || code,
                  value,
                  units: metric?.units || units,
                  referenceRange,
                  abnormalFlag
                };

                currentGroup.results.push(result);
              } catch (error) {
                console.warn('Warning: Error processing OBX segment:', error);
              }
            }
          } else if (segment.startsWith('ORC|')) {
            // Order information - may contain doctor information
            const orcParts = segment.split('|');
            
            // If we don't have doctor info yet and the ORC segment has enough parts
            if (!data.doctorInfo.name && orcParts.length > 10) {
              // Get the provider information from the 10th field (index 10)
              const providerInfo = orcParts[10];
              
              // Check if provider info exists and contains the expected format
              if (providerInfo && providerInfo.includes('^')) {
                // Split the provider info by the caret character
                const providerParts = providerInfo.split('^');
                
                // Check if we have at least the ID and last name
                if (providerParts.length >= 2) {
                  // Extract the provider ID (first part)
                  const providerId = providerParts[0];
                  
                  // Extract the last name (second part)
                  const lastName = providerParts[1];
                  
                  // Extract the first name (third part) if available
                  const firstName = providerParts.length > 2 ? providerParts[2] : '';
                  
                  // Extract the title (fifth part) if available, default to 'Dr'
                  const title = providerParts.length > 4 ? providerParts[4] : 'Dr';
                  
                  // Set the provider ID
                  data.doctorInfo.providerId = providerId;
                  
                  // Format the doctor name with title
                  data.doctorInfo.name = `${title} ${firstName} ${lastName}`.trim();
                }
              }
            }
          }
        } catch (error) {
          console.warn('Warning: Error processing segment:', error);
        }
      });

      return data;
    } catch (error) {
      console.error('Error parsing ORU file:', error);
      throw error;
    }
  }

  private normalizeUnit(unit: string): string {
    if (!unit) return '';
    
    // Common unit variations to normalize
    const unitMap: Record<string, string> = {
      'mm/h': 'mm/hr',
      'mmol/l': 'mmol/L',
      'umol/l': 'umol/L',
      'iu/l': 'IU/L',
      'u/l': 'U/L',
      'g/dl': 'g/dL',
      'mg/dl': 'mg/dL'
    };

    const lowerUnit = unit.toLowerCase();
    return unitMap[lowerUnit] || unit;
  }

  private findMatchingMetric(code: string, name: string, units: string): DiagnosticMetric | null {
    try {
      // Get all diagnostic metrics
      const metrics = this.dataService.getAllDiagnosticMetrics();
      
      if (!metrics?.length) {
        console.warn('Warning: No diagnostic metrics available');
        return null;
      }
      
      for (const metric of metrics) {
        if (!metric) continue;

        try {
          // Check if the code matches any of the ORU sonic codes
          if (metric.oru_sonic_codes) {
            const sonicCodes = metric.oru_sonic_codes
              .split(';')
              .map(c => c?.trim())
              .filter((c): c is string => c != null)
              .map(c => c.toLowerCase());

            const normalizedCode = code.toLowerCase();
            if (sonicCodes.some(c => normalizedCode.includes(c) || c.includes(normalizedCode))) {
              return metric;
            }
          }
          
          // Check if the name matches (case insensitive)
          if (metric.name && name) {
            const metricNameLower = metric.name.toLowerCase();
            const nameLower = name.toLowerCase();
            if (metricNameLower === nameLower) {
              return metric;
            }
          }
          
          // Check if units match and name is similar
          if (metric.name && name && metric.units === units) {
            const metricNameLower = metric.name.toLowerCase();
            const nameLower = name.toLowerCase();
            if (nameLower.includes(metricNameLower) || metricNameLower.includes(nameLower)) {
              return metric;
            }
          }
        } catch (error) {
          console.warn(`Warning: Error processing metric ${metric.name}:`, error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in findMatchingMetric:', error);
      return null;
    }
  }
} 