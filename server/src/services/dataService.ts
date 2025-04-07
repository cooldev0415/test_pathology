import { DiagnosticMetric, Diagnostic, DiagnosticGroup, Condition } from '../types/diagnostic';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';

export class DataService {
  private dataDirectory: string;
  private diagnosticMetrics: Map<string, DiagnosticMetric> = new Map();
  private diagnostics: Map<string, Diagnostic> = new Map();
  private diagnosticGroups: Map<string, DiagnosticGroup> = new Map();
  private conditions: Map<string, Condition> = new Map();
  private isLoaded: boolean = false;

  constructor(dataDirectory: string) {
    this.dataDirectory = dataDirectory;
    console.log(`Initializing DataService with directory: ${dataDirectory}`);
  }

  public isDataLoaded(): boolean {
    return this.isLoaded;
  }

  public async loadData(): Promise<void> {
    console.log('Starting data loading...');
    try {
      await this.loadDiagnosticMetrics();
      await this.loadDiagnostics();
      await this.loadDiagnosticGroups();
      await this.loadConditions();
      this.isLoaded = true;
      console.log('Data loading completed successfully');
      console.log(`Loaded ${this.diagnosticMetrics.size} diagnostic metrics`);
      console.log(`Loaded ${this.diagnostics.size} diagnostics`);
      console.log(`Loaded ${this.diagnosticGroups.size} diagnostic groups`);
      console.log(`Loaded ${this.conditions.size} conditions`);
    } catch (error) {
      console.error('Error loading data:', error);
      throw error;
    }
  }

  private async loadDiagnosticMetrics(): Promise<void> {
    const filePath = path.join(this.dataDirectory, 'diagnostic_metrics.csv');
    console.log(`Loading diagnostic metrics from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Diagnostic metrics file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, { columns: true });

    for (const record of records) {
      this.diagnosticMetrics.set(record.name, {
        id: record.id,
        name: record.name,
        code: record.code,
        group: record.group,
        description: record.description,
        highRisk: record.highRisk === 'true',
        oru_sonic_codes: record.oru_sonic_codes,
        diagnostic: record.diagnostic,
        diagnostic_groups: record.diagnostic_groups,
        units: record.units,
        standard_lower: record.standard_lower ? parseFloat(record.standard_lower) : undefined,
        standard_higher: record.standard_higher ? parseFloat(record.standard_higher) : undefined,
        everlab_lower: record.everlab_lower ? parseFloat(record.everlab_lower) : undefined,
        everlab_higher: record.everlab_higher ? parseFloat(record.everlab_higher) : undefined
      });
    }
  }

  private async loadDiagnostics(): Promise<void> {
    const filePath = path.join(this.dataDirectory, 'diagnostics.csv');
    console.log(`Loading diagnostics from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Diagnostics file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, { columns: true });

    for (const record of records) {
      this.diagnostics.set(record.name, {
        id: record.id,
        name: record.name,
        code: record.code,
        group: record.group,
        description: record.description,
        diagnostic_groups: record.diagnostic_groups,
        diagnostic_metrics: record.diagnostic_metrics
      });
    }
  }

  private async loadDiagnosticGroups(): Promise<void> {
    const filePath = path.join(this.dataDirectory, 'diagnostic_groups.csv');
    console.log(`Loading diagnostic groups from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Diagnostic groups file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, { columns: true });

    for (const record of records) {
      this.diagnosticGroups.set(record.name, {
        id: record.id,
        name: record.name,
        code: record.code,
        description: record.description,
        diagnostics: record.diagnostics,
        diagnostic_metrics: record.diagnostic_metrics
      });
    }
  }

  private async loadConditions(): Promise<void> {
    const filePath = path.join(this.dataDirectory, 'conditions.csv');
    console.log(`Loading conditions from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Conditions file not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = csv.parse(fileContent, { columns: true });

    for (const record of records) {
      this.conditions.set(record.name, {
        id: record.id,
        name: record.name,
        code: record.code,
        description: record.description,
        diagnostic_metrics: record.diagnostic_metrics ? record.diagnostic_metrics.split(',') : []
      });
    }
  }

  public getDiagnosticMetric(name: string): DiagnosticMetric | undefined {
    console.log(`Looking up diagnostic metric: ${name}`);
    const metric = this.diagnosticMetrics.get(name);
    console.log(metric ? `Found metric: ${metric.name}` : 'Metric not found');
    return metric;
  }

  public getDiagnostic(name: string): Diagnostic | undefined {
    return this.diagnostics.get(name);
  }

  public getDiagnosticGroup(name: string): DiagnosticGroup | undefined {
    return this.diagnosticGroups.get(name);
  }

  public getCondition(name: string): Condition | undefined {
    return this.conditions.get(name);
  }

  public getAllDiagnosticMetrics(): DiagnosticMetric[] {
    return Array.from(this.diagnosticMetrics.values());
  }

  public getAllDiagnostics(): Diagnostic[] {
    return Array.from(this.diagnostics.values());
  }

  public getAllDiagnosticGroups(): DiagnosticGroup[] {
    return Array.from(this.diagnosticGroups.values());
  }

  public getAllConditions(): Condition[] {
    return Array.from(this.conditions.values());
  }

  public getMetricsForGroup(groupName: string): DiagnosticMetric[] {
    const group = this.diagnosticGroups.get(groupName);
    if (!group || !group.diagnostic_metrics) {
      return [];
    }
    
    const metricNames = group.diagnostic_metrics.split(',').map((name: string) => name.trim());
    return metricNames
      .map((name: string) => this.diagnosticMetrics.get(name))
      .filter((metric: DiagnosticMetric | undefined): metric is DiagnosticMetric => metric !== undefined);
  }

  public getDiagnosticsForGroup(groupName: string): Diagnostic[] {
    const group = this.diagnosticGroups.get(groupName);
    if (!group || !group.diagnostics) {
      return [];
    }
    
    const diagnosticNames = group.diagnostics.split(',').map((name: string) => name.trim());
    return diagnosticNames
      .map((name: string) => this.diagnostics.get(name))
      .filter((diagnostic: Diagnostic | undefined): diagnostic is Diagnostic => diagnostic !== undefined);
  }

  public getConditionsForMetric(metricName: string): Condition[] {
    return Array.from(this.conditions.values()).filter(condition => 
      condition.diagnostic_metrics.includes(metricName)
    );
  }

  public getMetricsForDiagnostic(diagnosticName: string): DiagnosticMetric[] {
    const diagnostic = this.diagnostics.get(diagnosticName);
    if (!diagnostic || !diagnostic.diagnostic_metrics) {
      return [];
    }
    
    const metricNames = diagnostic.diagnostic_metrics.split(',').map(name => name.trim());
    return metricNames
      .map(name => this.diagnosticMetrics.get(name))
      .filter((metric): metric is DiagnosticMetric => metric !== undefined);
  }
} 