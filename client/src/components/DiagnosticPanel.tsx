import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, X, Activity, Database, Globe, Code, Server } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'loading';
  message: string;
  details?: any;
  timestamp: string;
}

interface SystemInfo {
  userAgent: string;
  url: string;
  timestamp: string;
  localStorage: boolean;
  sessionStorage: boolean;
  cookiesEnabled: boolean;
  online: boolean;
  language: string;
  platform: string;
  screen: {
    width: number;
    height: number;
  };
  viewport: {
    width: number;
    height: number;
  };
}

export function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    collectSystemInfo();
    collectConsoleLogs();
  }, []);

  const collectSystemInfo = () => {
    const info: SystemInfo = {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      localStorage: !!window.localStorage,
      sessionStorage: !!window.sessionStorage,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
      screen: {
        width: screen.width,
        height: screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    setSystemInfo(info);
  };

  const collectConsoleLogs = () => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const logBuffer: string[] = [];
    
    console.log = (...args) => {
      logBuffer.push(`[LOG] ${new Date().toISOString()}: ${args.join(' ')}`);
      originalLog.apply(console, args);
      setLogs([...logBuffer]);
    };
    
    console.error = (...args) => {
      logBuffer.push(`[ERROR] ${new Date().toISOString()}: ${args.join(' ')}`);
      originalError.apply(console, args);
      setLogs([...logBuffer]);
    };
    
    console.warn = (...args) => {
      logBuffer.push(`[WARN] ${new Date().toISOString()}: ${args.join(' ')}`);
      originalWarn.apply(console, args);
      setLogs([...logBuffer]);
    };
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    const results: DiagnosticResult[] = [];

    // Test 1: Basic DOM Functionality
    setProgress(10);
    try {
      const testElement = document.createElement('div');
      testElement.innerHTML = '<span>test</span>';
      results.push({
        name: 'DOM Functionality',
        status: 'success',
        message: 'DOM creation and manipulation working',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        name: 'DOM Functionality',
        status: 'error',
        message: `DOM error: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 2: React Component Rendering
    setProgress(20);
    try {
      const reactTest = document.getElementById('root');
      results.push({
        name: 'React Root Element',
        status: reactTest ? 'success' : 'error',
        message: reactTest ? 'React root element found' : 'React root element not found',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        name: 'React Root Element',
        status: 'error',
        message: `React error: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 3: API Health Check
    setProgress(30);
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          name: 'API Health Check',
          status: 'success',
          message: 'API server responding',
          details: data,
          timestamp: new Date().toISOString(),
        });
      } else {
        results.push({
          name: 'API Health Check',
          status: 'error',
          message: `API returned ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.push({
        name: 'API Health Check',
        status: 'error',
        message: `API connection failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 4: Database Connection Test
    setProgress(50);
    try {
      const response = await fetch('/api/tube-benders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          name: 'Database Connection',
          status: 'success',
          message: `Database responding - ${data.length} records found`,
          details: { recordCount: data.length },
          timestamp: new Date().toISOString(),
        });
      } else {
        results.push({
          name: 'Database Connection',
          status: 'error',
          message: `Database query failed: ${response.status}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.push({
        name: 'Database Connection',
        status: 'error',
        message: `Database connection failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 5: Authentication System
    setProgress(70);
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
        });
        
        if (response.ok) {
          results.push({
            name: 'Authentication System',
            status: 'success',
            message: 'Authentication working - user session valid',
            timestamp: new Date().toISOString(),
          });
        } else {
          results.push({
            name: 'Authentication System',
            status: 'warning',
            message: 'Authentication token invalid or expired',
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        results.push({
          name: 'Authentication System',
          status: 'warning',
          message: 'No authentication token found',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.push({
        name: 'Authentication System',
        status: 'error',
        message: `Authentication test failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 6: Network Connectivity
    setProgress(85);
    try {
      const startTime = performance.now();
      const response = await fetch('/api/health');
      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);
      
      results.push({
        name: 'Network Performance',
        status: latency < 1000 ? 'success' : latency < 3000 ? 'warning' : 'error',
        message: `API latency: ${latency}ms`,
        details: { latency },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        name: 'Network Performance',
        status: 'error',
        message: `Network test failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 7: Local Storage
    setProgress(85);
    try {
      const testKey = 'diagnostic_test';
      const testValue = 'test_value';
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      results.push({
        name: 'Local Storage',
        status: retrieved === testValue ? 'success' : 'error',
        message: retrieved === testValue ? 'Local storage working' : 'Local storage failed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      results.push({
        name: 'Local Storage',
        status: 'error',
        message: `Local storage error: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 8: Deployment Environment Check
    setProgress(90);
    try {
      const response = await fetch('/api/deployment-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          name: 'Deployment Environment',
          status: 'success',
          message: `Node.js ${data.nodeVersion} | Env: ${data.environment} | Dependencies: ${data.dependencyCount}`,
          details: data,
          timestamp: new Date().toISOString(),
        });
      } else {
        results.push({
          name: 'Deployment Environment',
          status: 'warning',
          message: 'Deployment check endpoint not available - may need server restart',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.push({
        name: 'Deployment Environment',
        status: 'warning',
        message: `Deployment check failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    // Test 9: File Structure Validation
    setProgress(95);
    try {
      const response = await fetch('/api/file-structure-check', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        const missingFiles = data.missingFiles || [];
        results.push({
          name: 'File Structure Validation',
          status: missingFiles.length === 0 ? 'success' : 'error',
          message: missingFiles.length === 0 ? 
            'All required deployment files present' : 
            `Missing files: ${missingFiles.join(', ')}`,
          details: data,
          timestamp: new Date().toISOString(),
        });
      } else {
        results.push({
          name: 'File Structure Validation',
          status: 'warning',
          message: 'File structure check not available',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      results.push({
        name: 'File Structure Validation',
        status: 'warning',
        message: `File structure check failed: ${error}`,
        timestamp: new Date().toISOString(),
      });
    }

    setProgress(100);
    setDiagnostics(results);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      loading: 'bg-blue-100 text-blue-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const generateCompleteReport = () => {
    const timestamp = new Date().toISOString();
    const successCount = diagnostics.filter(d => d.status === 'success').length;
    const warningCount = diagnostics.filter(d => d.status === 'warning').length;
    const errorCount = diagnostics.filter(d => d.status === 'error').length;
    
    return `
🔧 TUBEBENDERREVIEWS.COM - COMPLETE DIAGNOSTIC REPORT
Generated: ${new Date().toLocaleString()}
Report ID: TBR-${Date.now()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tests Passed: ${successCount}
⚠️  Warnings: ${warningCount}  
❌ Errors: ${errorCount}
📋 Total Tests: ${diagnostics.length}

Overall Status: ${errorCount > 0 ? '🔴 CRITICAL ISSUES DETECTED' : warningCount > 0 ? '🟡 MINOR ISSUES DETECTED' : '🟢 ALL SYSTEMS OPERATIONAL'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 DETAILED TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${diagnostics.map((result, index) => {
  const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
  const statusColor = result.status === 'success' ? '🟢' : result.status === 'warning' ? '🟡' : '🔴';
  
  return `${index + 1}. ${icon} ${result.name}
   Status: ${statusColor} ${result.status.toUpperCase()}
   Message: ${result.message}
   Timestamp: ${new Date(result.timestamp).toLocaleString()}${result.details ? `
   Details: ${JSON.stringify(result.details, null, 2)}` : ''}
   `;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💻 SYSTEM INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Environment:
   URL: ${systemInfo?.url || 'Not Available'}
   User Agent: ${systemInfo?.userAgent || 'Not Available'}
   Platform: ${systemInfo?.platform || 'Not Available'}
   Language: ${systemInfo?.language || 'Not Available'}
   Online Status: ${systemInfo?.online ? '🟢 Online' : '🔴 Offline'}

📱 Display:
   Screen: ${systemInfo?.screen?.width || 'N/A'} x ${systemInfo?.screen?.height || 'N/A'}
   Viewport: ${systemInfo?.viewport?.width || 'N/A'} x ${systemInfo?.viewport?.height || 'N/A'}

💾 Storage:
   Local Storage: ${systemInfo?.localStorage ? '✅ Available' : '❌ Unavailable'}
   Session Storage: ${systemInfo?.sessionStorage ? '✅ Available' : '❌ Unavailable'}
   Cookies: ${systemInfo?.cookiesEnabled ? '✅ Enabled' : '❌ Disabled'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 RECENT CONSOLE LOGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${logs.slice(-10).map((log, index) => `${index + 1}. ${log}`).join('\n') || 'No recent logs available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛠️ RECOMMENDED ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${errorCount > 0 ? '🔴 CRITICAL: Address all error conditions immediately\n' : ''}${warningCount > 0 ? '🟡 MONITOR: Review warning conditions\n' : ''}${errorCount === 0 && warningCount === 0 ? '🟢 MAINTAIN: System operating normally - continue monitoring\n' : ''}
📧 Contact: For technical support, share this complete report
🔄 Retest: Run diagnostics again after making changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

End of Report - Generated by TubeBenderReviews.com Diagnostic System
    `.trim();
  };

  const exportDiagnostics = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      systemInfo,
      diagnostics,
      logs: logs.slice(-50), // Last 50 logs
      url: window.location.href,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tubebenderreviews-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyReportToClipboard = async () => {
    const report = generateCompleteReport();
    try {
      await navigator.clipboard.writeText(report);
      alert('Complete report copied to clipboard! You can now paste it into ChatGPT, Replit assistant, or share with developers.');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: show in a text area for manual copying
      const textarea = document.createElement('textarea');
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Report copied to clipboard (fallback method)!');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Diagnostics & Debugging
          </CardTitle>
          <CardDescription>
            Comprehensive diagnostic tools to troubleshoot site issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 flex-wrap">
            <Button onClick={runDiagnostics} disabled={isRunning}>
              {isRunning ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Activity className="mr-2 h-4 w-4" />
              )}
              {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
            </Button>
            <Button variant="outline" onClick={copyReportToClipboard} className="bg-blue-50 border-blue-200 text-blue-700">
              📋 Generate Complete Report
            </Button>
            <Button variant="outline" onClick={exportDiagnostics}>
              💾 Export JSON
            </Button>
            <Button variant="outline" onClick={collectSystemInfo}>
              🔄 Refresh System Info
            </Button>
          </div>

          {isRunning && (
            <div className="mb-6">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">Running diagnostics... {progress}%</p>
            </div>
          )}

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="report">Complete Report</TabsTrigger>
              <TabsTrigger value="system">System Info</TabsTrigger>
              <TabsTrigger value="api">API Tests</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="manual">Manual Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {diagnostics.map((result, index) => (
                  <Alert key={index} className={result.status === 'error' ? 'border-red-200' : result.status === 'warning' ? 'border-yellow-200' : 'border-green-200'}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <AlertTitle>{result.name}</AlertTitle>
                        {getStatusBadge(result.status)}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <AlertDescription className="mt-2">
                      {result.message}
                      {result.details && (
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
              {diagnostics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No diagnostics run yet. Click "Run Full Diagnostics" to start testing.
                </div>
              )}
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <div className="bg-slate-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Complete Diagnostic Report</h3>
                  <Button onClick={copyReportToClipboard} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    📋 Copy Report
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  This comprehensive report is formatted for easy sharing with ChatGPT, Replit assistant, or developers. 
                  Copy the text below or use the "Copy Report" button.
                </p>
                {diagnostics.length > 0 ? (
                  <pre className="bg-white border rounded p-4 overflow-auto text-xs font-mono max-h-96 whitespace-pre-wrap">
                    {generateCompleteReport()}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Run diagnostics first to generate a complete report.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              {systemInfo && (
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Browser Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>User Agent:</strong></div>
                        <div className="break-all">{systemInfo.userAgent}</div>
                        <div><strong>Platform:</strong></div>
                        <div>{systemInfo.platform}</div>
                        <div><strong>Language:</strong></div>
                        <div>{systemInfo.language}</div>
                        <div><strong>Online:</strong></div>
                        <div>{systemInfo.online ? 'Yes' : 'No'}</div>
                        <div><strong>Cookies Enabled:</strong></div>
                        <div>{systemInfo.cookiesEnabled ? 'Yes' : 'No'}</div>
                        <div><strong>Local Storage:</strong></div>
                        <div>{systemInfo.localStorage ? 'Available' : 'Not Available'}</div>
                        <div><strong>Session Storage:</strong></div>
                        <div>{systemInfo.sessionStorage ? 'Available' : 'Not Available'}</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Display Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Screen Resolution:</strong></div>
                        <div>{systemInfo.screen.width} × {systemInfo.screen.height}</div>
                        <div><strong>Viewport Size:</strong></div>
                        <div>{systemInfo.viewport.width} × {systemInfo.viewport.height}</div>
                        <div><strong>Current URL:</strong></div>
                        <div className="break-all">{systemInfo.url}</div>
                        <div><strong>Timestamp:</strong></div>
                        <div>{new Date(systemInfo.timestamp).toLocaleString()}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    API Endpoint Tests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Health Check', endpoint: '/api/health' },
                    { name: 'Database Health', endpoint: '/api/health/db' },
                    { name: 'Deployment Check', endpoint: '/api/deployment-check' },
                    { name: 'File Structure', endpoint: '/api/file-structure-check' },
                    { name: 'Tube Benders', endpoint: '/api/tube-benders' },
                    { name: 'Auth Status', endpoint: '/api/auth/me' },
                  ].map((test) => (
                    <div key={test.endpoint} className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="text-sm">{test.name} ({test.endpoint})</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await fetch(test.endpoint, {
                                headers: localStorage.getItem('auth_token') ? 
                                  { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {}
                              });
                              const newResult: DiagnosticResult = {
                                name: `API Test: ${test.name}`,
                                status: response.ok ? 'success' : 'error',
                                message: `${test.name}: ${response.status} ${response.statusText}`,
                                timestamp: new Date().toISOString(),
                              };
                              setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                            } catch (error) {
                              const newResult: DiagnosticResult = {
                                name: `API Test: ${test.name}`,
                                status: 'error',
                                message: `${test.name} failed: ${error}`,
                                timestamp: new Date().toISOString(),
                              };
                              setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                            }
                          }}
                        >
                          Test
                        </Button>
                      </div>
                      
                      {/* Individual test result - shows only the latest result for this specific test */}
                      {(() => {
                        const latestResult = diagnostics.find(result => result.name === `API Test: ${test.name}`);
                        return latestResult ? (
                          <Alert className={`ml-4 ${
                            latestResult.status === 'success' ? 'border-green-200 bg-green-50' : 
                            latestResult.status === 'error' ? 'border-red-200 bg-red-50' : 
                            'border-yellow-200 bg-yellow-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {latestResult.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {latestResult.status === 'error' && <X className="h-4 w-4 text-red-600" />}
                                {latestResult.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                <span className="font-medium text-sm">Result</span>
                              </div>
                              <span className="text-xs text-gray-500">{new Date(latestResult.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <AlertDescription className="mt-1 text-sm">
                              {latestResult.message}
                            </AlertDescription>
                          </Alert>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Console Logs
                  </CardTitle>
                  <CardDescription>
                    Recent console output and error messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={logs.slice(-50).join('\n')}
                    readOnly
                    className="h-64 font-mono text-xs"
                    placeholder="Console logs will appear here..."
                  />
                  <div className="mt-2 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLogs([])}>
                      Clear Logs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => console.log('Manual test log entry')}>
                      Test Log Entry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Manual Testing Tools</CardTitle>
                  <CardDescription>
                    Quick manual tests for specific functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: 'Error Trigger',
                      testName: 'Manual Test: Error Trigger',
                      button: 'Trigger Test Error',
                      action: () => {
                        try {
                          throw new Error('Test error for debugging');
                        } catch (error) {
                          console.error('Manual test error:', error);
                          const newResult: DiagnosticResult = {
                            name: 'Manual Test: Error Trigger',
                            status: 'error',
                            message: 'Test error successfully thrown - check console for stack trace',
                            timestamp: new Date().toISOString(),
                          };
                          setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        }
                      }
                    },
                    {
                      name: 'Local Storage',
                      testName: 'Manual Test: Local Storage',
                      button: 'Test Local Storage',
                      action: () => {
                        try {
                          const testData = { test: true, timestamp: Date.now() };
                          localStorage.setItem('debug_test', JSON.stringify(testData));
                          const retrieved = localStorage.getItem('debug_test');
                          const newResult: DiagnosticResult = {
                            name: 'Manual Test: Local Storage',
                            status: retrieved ? 'success' : 'error',
                            message: retrieved ? 'Test data successfully saved and retrieved from localStorage' : 'Failed to save/retrieve localStorage data',
                            timestamp: new Date().toISOString(),
                          };
                          setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        } catch (error) {
                          const newResult: DiagnosticResult = {
                            name: 'Manual Test: Local Storage',
                            status: 'error',
                            message: `localStorage test failed: ${error}`,
                            timestamp: new Date().toISOString(),
                          };
                          setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        }
                      }
                    },
                    {
                      name: 'Page Reload',
                      testName: 'Manual Test: Page Reload',
                      button: 'Force Page Reload',
                      action: () => {
                        const newResult: DiagnosticResult = {
                          name: 'Manual Test: Page Reload',
                          status: 'success',
                          message: 'Page reload initiated - diagnostics will be cleared',
                          timestamp: new Date().toISOString(),
                        };
                        setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        setTimeout(() => {
                          window.location.reload();
                        }, 1000);
                      }
                    },
                    {
                      name: 'New Tab',
                      testName: 'Manual Test: New Tab',
                      button: 'Open Admin in New Tab',
                      action: () => {
                        try {
                          const newTab = window.open('/admin', '_blank');
                          const newResult: DiagnosticResult = {
                            name: 'Manual Test: New Tab',
                            status: newTab ? 'success' : 'warning',
                            message: newTab ? 'Admin panel opened in new tab successfully' : 'Failed to open new tab - popup may be blocked',
                            timestamp: new Date().toISOString(),
                          };
                          setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        } catch (error) {
                          const newResult: DiagnosticResult = {
                            name: 'Manual Test: New Tab',
                            status: 'error',
                            message: `New tab test failed: ${error}`,
                            timestamp: new Date().toISOString(),
                          };
                          setDiagnostics(prev => [newResult, ...prev.slice(0, 9)]);
                        }
                      }
                    }
                  ].map((test) => (
                    <div key={test.name} className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={test.action}
                        className="w-full"
                      >
                        {test.button}
                      </Button>
                      
                      {/* Individual test result - shows only the latest result for this specific test */}
                      {(() => {
                        const latestResult = diagnostics.find(result => result.name === test.testName);
                        return latestResult ? (
                          <Alert className={`ml-4 ${
                            latestResult.status === 'success' ? 'border-green-200 bg-green-50' : 
                            latestResult.status === 'error' ? 'border-red-200 bg-red-50' : 
                            'border-yellow-200 bg-yellow-50'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {latestResult.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {latestResult.status === 'error' && <X className="h-4 w-4 text-red-600" />}
                                {latestResult.status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                                <span className="font-medium text-sm">Result</span>
                              </div>
                              <span className="text-xs text-gray-500">{new Date(latestResult.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <AlertDescription className="mt-1 text-sm">
                              {latestResult.message}
                            </AlertDescription>
                          </Alert>
                        ) : null;
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}