/**
 * Shared types for debug functionality
 */

export interface DebugSettings {
  enabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxLogEntries: number;
  enableHttpLogging: boolean;
  enablePerformanceLogging: boolean;
}

export interface DebugLog {
  id: number;
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  source: string;
  details?: any;
}

export interface DiagnosticResult {
  status: 'ok' | 'issues_found' | 'error';
  issues: string[];
  recommendations: string[];
  details: Record<string, any>;
}

export interface DiagnosticSummary {
  timestamp: string;
  debugMode: boolean;
  summary: {
    totalChecks: number;
    passed: number;
    issues: number;
    errors: number;
  };
  diagnostics: {
    port: DiagnosticResult;
    auth: DiagnosticResult;
    routing: DiagnosticResult;
    performance: DiagnosticResult;
  };
}