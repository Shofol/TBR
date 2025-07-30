/**
 * Comprehensive Diagnostic System for FastComet Deployment Troubleshooting
 * Works independently of main application to diagnose deployment issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Request, Response } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global debug state
let debugMode = true; // Enabled by default as requested
const debugLogs: Array<{ timestamp: Date; level: string; message: string; source: string }> = [];
const MAX_LOGS = 1000;

/**
 * Add debug log entry
 */
export function addDebugLog(level: 'info' | 'warn' | 'error' | 'debug', message: string, source = 'system') {
  if (!debugMode && level !== 'error') return;
  
  debugLogs.push({
    timestamp: new Date(),
    level,
    message,
    source
  });
  
  // Keep only last MAX_LOGS entries
  if (debugLogs.length > MAX_LOGS) {
    debugLogs.splice(0, debugLogs.length - MAX_LOGS);
  }
  
  // Also log to console with timestamp
  const timestamp = new Date().toISOString();
  console.log(`[DEBUG ${timestamp}] [${level.toUpperCase()}] [${source}] ${message}`);
}

/**
 * Toggle debug mode
 */
export function setDebugMode(enabled: boolean) {
  debugMode = enabled;
  addDebugLog('info', `Debug mode ${enabled ? 'enabled' : 'disabled'}`, 'diagnostics');
}

/**
 * Get current debug mode status
 */
export function getDebugMode(): boolean {
  return debugMode;
}

/**
 * Port Detection Diagnostics
 */
function diagnosePortIssues() {
  const diagnostics = {
    status: 'checking',
    issues: [] as string[],
    recommendations: [] as string[],
    details: {} as any
  };

  try {
    // Check environment variables
    const port = process.env.PORT;
    const host = process.env.HOST;
    const nodeEnv = process.env.NODE_ENV;

    diagnostics.details = {
      PORT: port || 'not set',
      HOST: host || 'not set',
      NODE_ENV: nodeEnv || 'not set',
      actualPort: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
      processArgv: process.argv.slice(2),
      platform: process.platform,
      isPassenger: !!process.env.PASSENGER_SPAWN_METHOD,
      isReplit: !!process.env.REPL_ID
    };

    // Check for common port issues
    if (!port) {
      diagnostics.issues.push('PORT environment variable not set');
      diagnostics.recommendations.push('Set PORT environment variable in cPanel Node.js App');
    }

    if (port && (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535)) {
      diagnostics.issues.push(`Invalid PORT value: ${port}`);
      diagnostics.recommendations.push('PORT must be a number between 1 and 65535');
    }

    // Passenger specific checks
    if (process.env.PASSENGER_SPAWN_METHOD) {
      if (host && host !== '127.0.0.1' && host !== 'localhost') {
        diagnostics.issues.push(`Passenger typically requires host binding to localhost, current: ${host}`);
        diagnostics.recommendations.push('Remove HOST environment variable or set to 127.0.0.1');
      }
    }

    diagnostics.status = diagnostics.issues.length === 0 ? 'ok' : 'issues_found';
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.issues.push(`Port diagnosis failed: ${error}`);
  }

  return diagnostics;
}

/**
 * Authentication System Diagnostics
 */
function diagnoseAuthIssues() {
  const diagnostics = {
    status: 'checking',
    issues: [] as string[],
    recommendations: [] as string[],
    details: {} as any
  };

  try {
    // Check JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiry = process.env.JWT_EXPIRY;

    diagnostics.details = {
      jwtSecretSet: !!jwtSecret,
      jwtSecretLength: jwtSecret ? jwtSecret.length : 0,
      jwtExpiry: jwtExpiry || 'default',
      isDevelopment: process.env.NODE_ENV !== 'production'
    };

    // Check JWT secret
    if (!jwtSecret) {
      diagnostics.issues.push('JWT_SECRET environment variable not set');
      diagnostics.recommendations.push('Set JWT_SECRET to a secure random string (minimum 32 characters)');
    } else if (jwtSecret.length < 32) {
      diagnostics.issues.push(`JWT_SECRET too short: ${jwtSecret.length} characters (minimum 32)`);
      diagnostics.recommendations.push('Generate a longer JWT_SECRET for security');
    } else if (jwtSecret.includes('development') && process.env.NODE_ENV === 'production') {
      diagnostics.issues.push('Using development JWT_SECRET in production');
      diagnostics.recommendations.push('Generate a unique JWT_SECRET for production');
    }

    // Check database connection for user storage
    diagnostics.details.databaseUrl = process.env.DATABASE_URL ? 'set' : 'not set';
    if (!process.env.DATABASE_URL) {
      diagnostics.issues.push('DATABASE_URL not set - admin login will fail');
      diagnostics.recommendations.push('Configure DATABASE_URL with your NEON database connection string');
    }

    diagnostics.status = diagnostics.issues.length === 0 ? 'ok' : 'issues_found';
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.issues.push(`Auth diagnosis failed: ${error}`);
  }

  return diagnostics;
}

/**
 * File System and Routing Diagnostics
 */
function diagnoseRoutingIssues() {
  const diagnostics = {
    status: 'checking',
    issues: [] as string[],
    recommendations: [] as string[],
    details: {} as any
  };

  try {
    const cwd = process.cwd();
    const serverFile = path.resolve(cwd, 'dist', 'index.js');
    const clientBuild = path.resolve(cwd, 'dist', 'public');
    const indexHtml = path.resolve(clientBuild, 'index.html');

    diagnostics.details = {
      workingDirectory: cwd,
      serverBundleExists: fs.existsSync(serverFile),
      clientBuildExists: fs.existsSync(clientBuild),
      indexHtmlExists: fs.existsSync(indexHtml),
      nodeModulesExists: fs.existsSync(path.resolve(cwd, 'node_modules')),
      packageJsonExists: fs.existsSync(path.resolve(cwd, 'package.json')),
      envFileExists: fs.existsSync(path.resolve(cwd, '.env'))
    };

    // Check critical files
    if (!diagnostics.details.serverBundleExists) {
      diagnostics.issues.push('Server bundle (dist/index.js) not found');
      diagnostics.recommendations.push('Run "npm run build" to create the server bundle');
    }

    if (!diagnostics.details.clientBuildExists) {
      diagnostics.issues.push('Client build directory (dist/public) not found');
      diagnostics.recommendations.push('Ensure "npm run build" completes successfully');
    }

    if (!diagnostics.details.indexHtmlExists) {
      diagnostics.issues.push('index.html not found in client build');
      diagnostics.recommendations.push('Check that Vite build process completes without errors');
    }

    if (!diagnostics.details.nodeModulesExists) {
      diagnostics.issues.push('node_modules directory not found');
      diagnostics.recommendations.push('Run "npm install" to install dependencies');
    }

    if (!diagnostics.details.packageJsonExists) {
      diagnostics.issues.push('package.json not found');
      diagnostics.recommendations.push('Ensure package.json is uploaded to the server');
    }

    // Check for .htaccess issues (FastComet specific)
    const htaccessPath = path.resolve(cwd, '.htaccess');
    diagnostics.details.htaccessExists = fs.existsSync(htaccessPath);
    
    if (diagnostics.details.htaccessExists) {
      try {
        const htaccessContent = fs.readFileSync(htaccessPath, 'utf-8');
        diagnostics.details.htaccessContent = htaccessContent.substring(0, 500); // First 500 chars
        
        // Check for common problematic patterns
        if (htaccessContent.includes('RewriteEngine On')) {
          diagnostics.issues.push('.htaccess contains URL rewriting rules that may conflict with Node.js');
          diagnostics.recommendations.push('Remove or rename .htaccess file - Node.js handles routing internally');
        }
      } catch (error) {
        diagnostics.issues.push('Unable to read .htaccess file');
      }
    }

    diagnostics.status = diagnostics.issues.length === 0 ? 'ok' : 'issues_found';
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.issues.push(`Routing diagnosis failed: ${error}`);
  }

  return diagnostics;
}

/**
 * Node.js Performance Diagnostics
 */
function diagnosePerformanceIssues() {
  const diagnostics = {
    status: 'checking',
    issues: [] as string[],
    recommendations: [] as string[],
    details: {} as any
  };

  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    diagnostics.details = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.round(uptime),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024)
      },
      cpuUsage: process.cpuUsage(),
      pid: process.pid,
      ppid: process.ppid,
      env: {
        nodeEnv: process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production'
      }
    };

    // Check Node.js version
    const majorVersion = parseInt(process.version.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      diagnostics.issues.push(`Node.js version ${process.version} is outdated`);
      diagnostics.recommendations.push('Upgrade to Node.js 18 or higher for optimal performance');
    }

    // Check memory usage
    const heapUsedMB = diagnostics.details.memoryUsage.heapUsed;
    if (heapUsedMB > 200) {
      diagnostics.issues.push(`High memory usage: ${heapUsedMB}MB`);
      diagnostics.recommendations.push('Monitor memory usage - consider restarting if it continues to grow');
    }

    // Check for production optimizations
    if (process.env.NODE_ENV !== 'production') {
      diagnostics.issues.push('NODE_ENV is not set to production');
      diagnostics.recommendations.push('Set NODE_ENV=production for optimal performance');
    }

    diagnostics.status = diagnostics.issues.length === 0 ? 'ok' : 'issues_found';
  } catch (error) {
    diagnostics.status = 'error';
    diagnostics.issues.push(`Performance diagnosis failed: ${error}`);
  }

  return diagnostics;
}

/**
 * Run all diagnostics
 */
export function runAllDiagnostics() {
  addDebugLog('info', 'Running comprehensive diagnostics', 'diagnostics');
  
  const results = {
    timestamp: new Date().toISOString(),
    debugMode,
    summary: {
      totalChecks: 0,
      passed: 0,
      issues: 0,
      errors: 0
    },
    diagnostics: {
      port: diagnosePortIssues(),
      auth: diagnoseAuthIssues(),
      routing: diagnoseRoutingIssues(),
      performance: diagnosePerformanceIssues()
    }
  };

  // Calculate summary
  Object.values(results.diagnostics).forEach(diag => {
    results.summary.totalChecks++;
    if (diag.status === 'ok') results.summary.passed++;
    else if (diag.status === 'issues_found') results.summary.issues++;
    else if (diag.status === 'error') results.summary.errors++;
  });

  addDebugLog('info', `Diagnostics complete: ${results.summary.passed}/${results.summary.totalChecks} passed`, 'diagnostics');
  
  return results;
}

/**
 * Get recent debug logs
 */
export function getDebugLogs(limit = 100) {
  return debugLogs.slice(-limit).reverse(); // Most recent first
}

/**
 * Generate HTML debug page
 */
export function generateDebugHTML(): string {
  const diagnostics = runAllDiagnostics();
  const logs = getDebugLogs(50);
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'ok': return '#22c55e';
      case 'issues_found': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TubeBenderReviews - Debug Panel</title>
    <style>
        body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .summary-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .summary-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #64748b; }
        .summary-card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
        .diagnostic-section { background: white; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
        .diagnostic-header { padding: 15px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
        .diagnostic-content { padding: 15px; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: white; }
        .issue { background: #fef2f2; color: #991b1b; padding: 10px; border-radius: 4px; margin: 5px 0; border-left: 3px solid #ef4444; }
        .recommendation { background: #f0f9ff; color: #1e40af; padding: 10px; border-radius: 4px; margin: 5px 0; border-left: 3px solid #3b82f6; }
        .details { background: #f8fafc; padding: 10px; border-radius: 4px; margin: 10px 0; font-family: monospace; font-size: 12px; }
        .logs-section { background: white; border-radius: 8px; padding: 15px; }
        .log-entry { padding: 8px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; }
        .log-timestamp { color: #64748b; }
        .log-level { font-weight: bold; margin: 0 5px; }
        .log-level-info { color: #3b82f6; }
        .log-level-warn { color: #f59e0b; }
        .log-level-error { color: #ef4444; }
        .log-level-debug { color: #64748b; }
        .refresh-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        .refresh-btn:hover { background: #2563eb; }
        .copy-btn { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
        .copy-btn:hover { background: #059669; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 TubeBenderReviews Debug Panel</h1>
            <p>FastComet Deployment Diagnostics - Generated at ${diagnostics.timestamp}</p>
            <p>Debug Mode: <strong>${debugMode ? 'ENABLED' : 'DISABLED'}</strong></p>
            
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Diagnostics</button>
            <button class="copy-btn" onclick="copyDiagnostics()">📋 Copy Report</button>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Checks</h3>
                <div class="value">${diagnostics.summary.totalChecks}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value" style="color: #22c55e;">${diagnostics.summary.passed}</div>
            </div>
            <div class="summary-card">
                <h3>Issues Found</h3>
                <div class="value" style="color: #f59e0b;">${diagnostics.summary.issues}</div>
            </div>
            <div class="summary-card">
                <h3>Errors</h3>
                <div class="value" style="color: #ef4444;">${diagnostics.summary.errors}</div>
            </div>
        </div>

        ${Object.entries(diagnostics.diagnostics).map(([key, diag]) => `
        <div class="diagnostic-section">
            <div class="diagnostic-header">
                <span class="status-badge" style="background-color: ${statusColor(diag.status)};">
                    ${diag.status.replace('_', ' ').toUpperCase()}
                </span>
                <h2>${key.toUpperCase()} DIAGNOSTICS</h2>
            </div>
            <div class="diagnostic-content">
                ${diag.issues.length > 0 ? `
                    <h3>Issues Found:</h3>
                    ${diag.issues.map(issue => `<div class="issue">❌ ${issue}</div>`).join('')}
                ` : ''}
                
                ${diag.recommendations.length > 0 ? `
                    <h3>Recommendations:</h3>
                    ${diag.recommendations.map(rec => `<div class="recommendation">💡 ${rec}</div>`).join('')}
                ` : ''}
                
                <h3>Details:</h3>
                <div class="details">${JSON.stringify(diag.details, null, 2)}</div>
            </div>
        </div>
        `).join('')}

        <div class="logs-section">
            <h2>Recent Debug Logs (${logs.length} entries)</h2>
            ${logs.map(log => `
            <div class="log-entry">
                <span class="log-timestamp">${log.timestamp.toISOString()}</span>
                <span class="log-level log-level-${log.level}">[${log.level.toUpperCase()}]</span>
                <span class="log-source">[${log.source}]</span>
                <span class="log-message">${log.message}</span>
            </div>
            `).join('')}
        </div>
    </div>

    <script>
        function copyDiagnostics() {
            const diagnosticsText = \`TubeBenderReviews Debug Report
Generated: ${diagnostics.timestamp}
Debug Mode: ${debugMode ? 'ENABLED' : 'DISABLED'}

SUMMARY:
- Total Checks: ${diagnostics.summary.totalChecks}
- Passed: ${diagnostics.summary.passed}
- Issues: ${diagnostics.summary.issues}
- Errors: ${diagnostics.summary.errors}

${Object.entries(diagnostics.diagnostics).map(([key, diag]) => `
${key.toUpperCase()} DIAGNOSTICS: ${diag.status.toUpperCase()}
${diag.issues.length > 0 ? 'Issues:\n' + diag.issues.map(i => '- ' + i).join('\n') + '\n' : ''}
${diag.recommendations.length > 0 ? 'Recommendations:\n' + diag.recommendations.map(r => '- ' + r).join('\n') + '\n' : ''}
Details:
${JSON.stringify(diag.details, null, 2)}
`).join('\n')}

RECENT LOGS:
${logs.slice(0, 20).map(log => `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`).join('\n')}
\`;
            
            navigator.clipboard.writeText(diagnosticsText).then(() => {
                alert('Debug report copied to clipboard!');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = diagnosticsText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                alert('Debug report copied to clipboard!');
            });
        }
    </script>
</body>
</html>
  `;

  return html;
}

/**
 * Debug endpoint handler
 */
export function debugEndpointHandler(req: Request, res: Response) {
  try {
    addDebugLog('info', `Debug endpoint accessed from ${req.ip}`, 'debug-endpoint');
    
    const html = generateDebugHTML();
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(html);
  } catch (error) {
    // Fallback if even the debug system fails
    const fallbackHtml = `
<!DOCTYPE html>
<html>
<head><title>Debug System Error</title></head>
<body style="font-family: monospace; padding: 20px;">
    <h1>Debug System Error</h1>
    <p>The debug system itself encountered an error:</p>
    <pre>${error}</pre>
    <p>Basic system information:</p>
    <ul>
        <li>Node.js Version: ${process.version}</li>
        <li>Platform: ${process.platform}</li>
        <li>Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB</li>
        <li>Uptime: ${Math.round(process.uptime())}s</li>
        <li>PID: ${process.pid}</li>
        <li>Working Directory: ${process.cwd()}</li>
        <li>Environment: ${process.env.NODE_ENV || 'not set'}</li>
    </ul>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(500).send(fallbackHtml);
  }
}

// Initialize debug logging
addDebugLog('info', 'Diagnostic system initialized', 'diagnostics');