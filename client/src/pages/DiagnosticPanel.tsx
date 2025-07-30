/**
 * Diagnostic Panel Component for Admin Access
 * Provides debugging controls and real-time system diagnostics
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Download, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  status: 'ok' | 'issues_found' | 'error';
  issues: string[];
  recommendations: string[];
  details: Record<string, any>;
}

interface DiagnosticSummary {
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

export default function DiagnosticPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch debug status
  const { data: debugStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/debug/status'],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Debug mode toggle mutation
  const toggleDebugMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await apiRequest('/api/admin/debug/toggle', {
        method: 'POST',
        body: { enabled },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/debug/status'] });
      toast({
        title: 'Debug Mode Updated',
        description: 'Debug mode has been successfully toggled.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to toggle debug mode: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Generate debug report
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/debug/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.text();
    },
    onSuccess: (html) => {
      // Open debug report in new window
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
      toast({
        title: 'Debug Report Generated',
        description: 'Debug report opened in new window.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to generate debug report: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'issues_found': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'issues_found': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading diagnostic data...</span>
      </div>
    );
  }

  const diagnostics: DiagnosticSummary = debugStatus?.diagnostics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Diagnostics</h2>
          <p className="text-muted-foreground">
            Monitor and troubleshoot deployment issues
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Debug Mode</span>
            <Switch
              checked={debugStatus?.debugMode || false}
              onCheckedChange={(enabled) => toggleDebugMutation.mutate(enabled)}
              disabled={toggleDebugMutation.isPending}
            />
          </div>
          
          <Button 
            onClick={() => refetch()}
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            onClick={() => generateReportMutation.mutate()}
            variant="outline" 
            size="sm"
            disabled={generateReportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Full Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{diagnostics.summary.totalChecks}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Passed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{diagnostics.summary.passed}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{diagnostics.summary.issues}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{diagnostics.summary.errors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Access Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Direct Debug Access:</strong> Even if this admin panel fails, you can access comprehensive diagnostics at{' '}
          <code className="bg-muted px-1 py-0.5 rounded">
            {window.location.origin}/__debug
          </code>
        </AlertDescription>
      </Alert>

      {/* Diagnostic Results */}
      {diagnostics && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="port">Port & Hosting</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="routing">Routing & Files</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="complete">Complete Report</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(diagnostics.diagnostics).map(([key, result]) => (
                <Card key={key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{key} Diagnostics</CardTitle>
                      <Badge className={getStatusColor(result.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(result.status)}
                          <span className="capitalize">{result.status.replace('_', ' ')}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-red-600">Issues Found:</h4>
                        <ul className="space-y-1">
                          {result.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-600 flex items-start">
                              <XCircle className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.recommendations.length > 0 && (
                      <div className="space-y-2 mt-3">
                        <h4 className="font-medium text-sm text-blue-600">Recommendations:</h4>
                        <ul className="space-y-1">
                          {result.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-blue-600 flex items-start">
                              <Info className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Individual diagnostic tabs */}
          {Object.entries(diagnostics.diagnostics).map(([key, result]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{key} Diagnostics</CardTitle>
                    <Badge className={getStatusColor(result.status)}>
                      {getStatusIcon(result.status)}
                      <span className="ml-1 capitalize">{result.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.issues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Issues Found:</h4>
                      <div className="space-y-2">
                        {result.issues.map((issue, idx) => (
                          <Alert key={idx} variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{issue}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-blue-600">Recommendations:</h4>
                      <div className="space-y-2">
                        {result.recommendations.map((rec, idx) => (
                          <Alert key={idx}>
                            <Info className="h-4 w-4" />
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium mb-2">Technical Details:</h4>
                    <ScrollArea className="h-64 w-full rounded border bg-muted p-3">
                      <pre className="text-xs">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="complete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete Diagnostic Report</CardTitle>
                <CardDescription>
                  User-readable report format for sharing with support or developers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Generated: {new Date(diagnostics.timestamp).toLocaleString()}
                    </span>
                    <Button 
                      onClick={() => generateReportMutation.mutate()}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Open Full Report
                    </Button>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      The complete report includes all diagnostic details, system information, 
                      and recent debug logs. This can be shared with ChatGPT or developers for troubleshooting.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}