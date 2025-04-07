"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv = __importStar(require("csv-parse/sync"));
/**
 * Service for loading and managing reference data
 */
class DataService {
    constructor(dataDirectory) {
        this.diagnosticMetrics = new Map();
        this.diagnostics = new Map();
        this.diagnosticGroups = new Map();
        this.conditions = new Map();
        this.isLoaded = false;
        this.dataDirectory = dataDirectory;
        console.log(`Initializing DataService with directory: ${dataDirectory}`);
    }
    isDataLoaded() {
        return this.isLoaded;
    }
    /**
     * Load all reference data from CSV files
     */
    loadData() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Starting data loading...');
            try {
                yield this.loadDiagnosticMetrics();
                yield this.loadDiagnostics();
                yield this.loadDiagnosticGroups();
                yield this.loadConditions();
                this.isLoaded = true;
                console.log('Data loading completed successfully');
                console.log(`Loaded ${this.diagnosticMetrics.size} diagnostic metrics`);
                console.log(`Loaded ${this.diagnostics.size} diagnostics`);
                console.log(`Loaded ${this.diagnosticGroups.size} diagnostic groups`);
                console.log(`Loaded ${this.conditions.size} conditions`);
            }
            catch (error) {
                console.error('Error loading data:', error);
                throw error;
            }
        });
    }
    /**
     * Load diagnostic metrics from CSV
     */
    loadDiagnosticMetrics() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Load diagnostics from CSV
     */
    loadDiagnostics() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Load diagnostic groups from CSV
     */
    loadDiagnosticGroups() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Load conditions from CSV
     */
    loadConditions() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Get a diagnostic metric by name
     */
    getDiagnosticMetric(name) {
        console.log(`Looking up diagnostic metric: ${name}`);
        const metric = this.diagnosticMetrics.get(name);
        console.log(metric ? `Found metric: ${metric.name}` : 'Metric not found');
        return metric;
    }
    /**
     * Get a diagnostic by name
     */
    getDiagnostic(name) {
        return this.diagnostics.get(name);
    }
    /**
     * Get a diagnostic group by name
     */
    getDiagnosticGroup(name) {
        return this.diagnosticGroups.get(name);
    }
    /**
     * Get a condition by name
     */
    getCondition(name) {
        return this.conditions.get(name);
    }
    /**
     * Get all diagnostic metrics
     */
    getAllDiagnosticMetrics() {
        return Array.from(this.diagnosticMetrics.values());
    }
    /**
     * Get all diagnostics
     */
    getAllDiagnostics() {
        return Array.from(this.diagnostics.values());
    }
    /**
     * Get all diagnostic groups
     */
    getAllDiagnosticGroups() {
        return Array.from(this.diagnosticGroups.values());
    }
    /**
     * Get all conditions
     */
    getAllConditions() {
        return Array.from(this.conditions.values());
    }
    /**
     * Get all diagnostic metrics for a diagnostic group
     */
    getMetricsForGroup(groupName) {
        const group = this.diagnosticGroups.get(groupName);
        if (!group || !group.diagnostic_metrics) {
            return [];
        }
        const metricNames = group.diagnostic_metrics.split(',').map(name => name.trim());
        return metricNames
            .map(name => this.diagnosticMetrics.get(name))
            .filter((metric) => metric !== undefined);
    }
    /**
     * Get all diagnostics for a diagnostic group
     */
    getDiagnosticsForGroup(groupName) {
        const group = this.diagnosticGroups.get(groupName);
        if (!group || !group.diagnostics) {
            return [];
        }
        const diagnosticNames = group.diagnostics.split(',').map(name => name.trim());
        return diagnosticNames
            .map(name => this.diagnostics.get(name))
            .filter((diagnostic) => diagnostic !== undefined);
    }
    /**
     * Get all conditions that reference a diagnostic metric
     */
    getConditionsForMetric(metricName) {
        return Array.from(this.conditions.values()).filter(condition => condition.diagnostic_metrics.includes(metricName));
    }
    /**
     * Get all diagnostic metrics for a diagnostic
     */
    getMetricsForDiagnostic(diagnosticName) {
        const diagnostic = this.diagnostics.get(diagnosticName);
        if (!diagnostic || !diagnostic.diagnostic_metrics) {
            return [];
        }
        const metricNames = diagnostic.diagnostic_metrics.split(',').map(name => name.trim());
        return metricNames
            .map(name => this.diagnosticMetrics.get(name))
            .filter((metric) => metric !== undefined);
    }
}
exports.DataService = DataService;
