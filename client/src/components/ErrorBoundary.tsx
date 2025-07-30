import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Copy, Download } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error in localStorage for debugging
    try {
      const errorLog = {
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };
      
      const existingErrors = JSON.parse(localStorage.getItem('react_errors') || '[]');
      existingErrors.push(errorLog);
      localStorage.setItem('react_errors', JSON.stringify(existingErrors.slice(-10))); // Keep last 10 errors
    } catch (storageError) {
      console.error('Failed to store error in localStorage:', storageError);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  };

  copyErrorToClipboard = () => {
    const errorText = this.getErrorText();
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    });
  };

  downloadErrorReport = () => {
    const errorData = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: this.state.error ? {
        name: this.state.error.name,
        message: this.state.error.message,
        stack: this.state.error.stack,
      } : null,
      errorInfo: this.state.errorInfo,
      url: window.location.href,
      userAgent: navigator.userAgent,
      localStorage: this.getStorageData(),
    };

    const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${this.state.errorId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  getStorageData = () => {
    try {
      return {
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {} as Record<string, string | null>),
      };
    } catch {
      return { error: 'Unable to access storage' };
    }
  };

  getErrorText = () => {
    const { error, errorInfo, errorId } = this.state;
    return `
TubeBenderReviews Error Report
=============================
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}

Error Details:
--------------
${error?.name}: ${error?.message}

Stack Trace:
------------
${error?.stack}

Component Stack:
----------------
${errorInfo?.componentStack}

Additional Info:
----------------
${JSON.stringify(this.getStorageData(), null, 2)}
    `.trim();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Application Error Detected
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error ID: {this.state.errorId}</AlertTitle>
                  <AlertDescription>
                    A React component error has occurred. The admin panel is still accessible 
                    through the diagnostic tools below.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Recovery Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button onClick={this.handleReset} className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                      <Button onClick={this.handleReload} variant="outline" className="w-full">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reload Page
                      </Button>
                      <Button 
                        onClick={() => window.location.href = '/admin-login'} 
                        variant="outline" 
                        className="w-full"
                      >
                        Go to Admin Login
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Debug Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button onClick={this.copyErrorToClipboard} variant="outline" className="w-full">
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Error Details
                      </Button>
                      <Button onClick={this.downloadErrorReport} variant="outline" className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Download Error Report
                      </Button>
                      <Button 
                        onClick={() => localStorage.clear()} 
                        variant="outline" 
                        className="w-full"
                      >
                        Clear Local Storage
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {this.state.error && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Error Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="font-mono text-sm text-red-800">
                          <strong>{this.state.error.name}:</strong> {this.state.error.message}
                        </p>
                        {this.state.error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-red-700 hover:text-red-900">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">
                              {this.state.error.stack}
                            </pre>
                          </details>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Alternative Access</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      If the main admin panel is not working, you can still access these URLs directly:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div>• <a href="/admin-login" className="text-blue-600 hover:underline">Admin Login</a></div>
                      <div>• <a href="/api/health" className="text-blue-600 hover:underline">API Health Check</a></div>
                      <div>• <a href="/api/tube-benders" className="text-blue-600 hover:underline">API Data Test</a></div>
                      <div>• <a href="/" className="text-blue-600 hover:underline">Main Site</a></div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;