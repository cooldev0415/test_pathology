export interface DiagnosticMetric {
  id: string;
  name: string;
  code: string;
  group: string;
  description: string;
  highRisk: boolean;
  oru_sonic_codes: string;
  diagnostic: string;
  diagnostic_groups: string;
  units: string;
  standard_lower?: number;
  standard_higher?: number;
  everlab_lower?: number;
  everlab_higher?: number;
  min_age?: number;
  max_age?: number;
  gender?: 'M' | 'F' | null;
}

export interface Diagnostic {
  id: string;
  name: string;
  code: string;
  group: string;
  description: string;
  diagnostic_groups: string;
  diagnostic_metrics: string;
}

export interface DiagnosticGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  diagnostics: string;
  diagnostic_metrics: string;
}

export interface Condition {
  id: string;
  name: string;
  code: string;
  description: string;
  diagnostic_metrics: string[];
} 