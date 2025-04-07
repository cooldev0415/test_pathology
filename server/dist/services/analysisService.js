"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisService = void 0;
/**
 * Service for analyzing ORU data
 */
class AnalysisService {
    constructor(dataService) {
        this.dataService = dataService;
    }
    /**
     * Analyze ORU data and identify abnormal results
     */
    analyzeORUData(oruData) {
        console.log('Analyzing ORU data:', JSON.stringify(oruData, null, 2));
        const abnormalResults = [];
        // Process each test group
        for (const group of oruData.testGroups) {
            console.log(`Processing test group: ${group.name}`);
            // Process each result in the group
            for (const result of group.results) {
                console.log(`Processing result: ${result.name} = ${result.value} ${result.units} (${result.abnormalFlag})`);
                // Check if the result is abnormal based on the abnormal flag
                const isAbnormal = this.isAbnormalResult(result);
                if (isAbnormal) {
                    console.log(`Abnormal result found: ${result.name}`);
                    // Get the diagnostic metric for this test
                    const diagnosticMetric = this.dataService.getDiagnosticMetric(result.name);
                    if (diagnosticMetric) {
                        console.log(`Found diagnostic metric for ${result.name}:`, diagnosticMetric);
                        // Get the conditions associated with this metric
                        const conditions = this.getConditionsForMetric(diagnosticMetric);
                        console.log(`Conditions for ${result.name}:`, conditions);
                        // Check if this is a high-risk result
                        const isHighRisk = this.isHighRiskResult(result, diagnosticMetric);
                        console.log(`Is high risk: ${isHighRisk}`);
                        // Add to abnormal results
                        abnormalResults.push({
                            testName: result.name,
                            value: result.value,
                            units: result.units,
                            referenceRange: result.referenceRange,
                            conditions: conditions.map((c) => c.name),
                            isHighRisk
                        });
                    }
                    else {
                        console.log(`No diagnostic metric found for ${result.name}`);
                        // Add to abnormal results without conditions
                        abnormalResults.push({
                            testName: result.name,
                            value: result.value,
                            units: result.units,
                            referenceRange: result.referenceRange,
                            conditions: [],
                            isHighRisk: false
                        });
                    }
                }
                else {
                    console.log(`Normal result: ${result.name}`);
                }
            }
        }
        console.log(`Found ${abnormalResults.length} abnormal results`);
        // Return the diagnostic result
        return {
            patientInfo: oruData.patientInfo,
            doctorInfo: oruData.doctorInfo,
            abnormalResults
        };
    }
    /**
     * Get conditions associated with a metric
     */
    getConditionsForMetric(metric) {
        const allConditions = this.dataService.getAllConditions();
        return allConditions.filter((condition) => condition.diagnostic_metrics && condition.diagnostic_metrics.includes(metric.name));
    }
    /**
     * Check if a result is abnormal based on the abnormal flag
     */
    isAbnormalResult(result) {
        // Get the diagnostic metric for this test
        const diagnosticMetric = this.dataService.getDiagnosticMetric(result.name);
        // Check the abnormal flag first
        if (result.abnormalFlag) {
            // Common abnormal flags: H (High), L (Low), A (Abnormal), etc.
            return ['H', 'L', 'A', 'HH', 'LL', '>', '<', '+', '-'].includes(result.abnormalFlag);
        }
        // If we have a diagnostic metric, use its reference ranges
        if (diagnosticMetric) {
            const value = parseFloat(result.value);
            if (!isNaN(value)) {
                // Check against standard range
                if (diagnosticMetric.standard_lower !== undefined && diagnosticMetric.standard_higher !== undefined) {
                    if (value < diagnosticMetric.standard_lower || value > diagnosticMetric.standard_higher) {
                        return true;
                    }
                }
                // Check against Everlab range
                if (diagnosticMetric.everlab_lower !== undefined && diagnosticMetric.everlab_higher !== undefined) {
                    if (value < diagnosticMetric.everlab_lower || value > diagnosticMetric.everlab_higher) {
                        return true;
                    }
                }
            }
        }
        // If no diagnostic metric or ranges, fall back to parsing the reference range
        if (result.referenceRange) {
            const [min, max] = this.parseReferenceRange(result.referenceRange);
            const value = parseFloat(result.value);
            if (!isNaN(value) && (value < min || value > max)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Parse a reference range string into min and max values
     */
    parseReferenceRange(range) {
        // Common formats: "10-20", "10 - 20", "<20", ">10", "10-"
        const parts = range.split(/[-\s]+/).filter(part => part.trim());
        if (parts.length === 2) {
            // Range format: "10-20"
            return [parseFloat(parts[0]), parseFloat(parts[1])];
        }
        else if (parts.length === 1) {
            if (range.startsWith('<')) {
                // Less than format: "<20"
                return [Number.NEGATIVE_INFINITY, parseFloat(parts[0])];
            }
            else if (range.startsWith('>')) {
                // Greater than format: ">10"
                return [parseFloat(parts[0]), Number.POSITIVE_INFINITY];
            }
            else if (range.endsWith('-')) {
                // Greater than format: "10-"
                return [parseFloat(parts[0]), Number.POSITIVE_INFINITY];
            }
            else {
                // Single value
                const value = parseFloat(parts[0]);
                return [value, value];
            }
        }
        // Default range if parsing fails
        return [Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY];
    }
    /**
     * Check if a result is high risk based on the diagnostic metric
     */
    isHighRiskResult(result, metric) {
        // Check if the metric has a high risk flag
        if (metric.highRisk) {
            return true;
        }
        const value = parseFloat(result.value);
        if (isNaN(value)) {
            return false;
        }
        // Use standard range for high risk assessment
        if (metric.standard_lower !== undefined && metric.standard_higher !== undefined) {
            const range = metric.standard_higher - metric.standard_lower;
            if (range > 0) {
                const deviation = Math.max(Math.abs((value - metric.standard_lower) / range), Math.abs((value - metric.standard_higher) / range));
                // If the value is more than 50% outside the range, consider it high risk
                return deviation > 0.5;
            }
        }
        // Fall back to reference range if no standard range
        if (result.referenceRange) {
            const [min, max] = this.parseReferenceRange(result.referenceRange);
            const range = max - min;
            if (range > 0) {
                const deviation = Math.max(Math.abs((value - min) / range), Math.abs((value - max) / range));
                return deviation > 0.5;
            }
        }
        return false;
    }
}
exports.AnalysisService = AnalysisService;
