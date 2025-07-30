/**
 * Production-specific utilities for third-party hosting environments like FastComet
 */

import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Enhanced static file serving for production environments
 * Handles multiple possible build directory locations
 */
export function serveStaticFiles(app: Express) {
  // Multiple possible locations for built static files in different hosting environments
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(__dirname, "..", "public")
  ];
  
  let distPath: string | null = null;
  
  // Find the first existing path
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      console.log(`✅ Found static files at: ${distPath}`);
      break;
    }
  }

  if (!distPath) {
    console.error("❌ Could not find build directory in any of these locations:");
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    
    // Create a minimal error response instead of crashing
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return; // Let API routes handle themselves
      }
      res.status(503).send(`
        <html>
          <head><title>Service Unavailable</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Service Temporarily Unavailable</h1>
            <p>The application is being deployed. Please try again in a few minutes.</p>
            <p><small>Error: Static files not found. Please ensure the application is built correctly.</small></p>
          </body>
        </html>
      `);
    });
    return;
  }

  // Serve static files with proper headers for caching
  app.use(express.static(distPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
    index: false // Don't serve index.html automatically
  }));

  // Serve index.html for all non-API routes (SPA fallback)
  const indexPath = path.join(distPath, 'index.html');
  
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return;
    }
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      return res.status(503).send(`
        <html>
          <head><title>Service Unavailable</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>Service Temporarily Unavailable</h1>
            <p>The application is being deployed. Please try again in a few minutes.</p>
            <p><small>Error: index.html not found at ${indexPath}</small></p>
          </body>
        </html>
      `);
    }
    
    // Set proper headers for HTML files
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.sendFile(indexPath);
  });
}

/**
 * Production environment detection and configuration
 */
export function getProductionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isPrimaryHost = process.env.NODE_ENV === 'production' && 
                       (process.env.HOST?.includes('tubebenderreviews.com') || 
                        process.env.ALLOWED_ORIGINS?.includes('tubebenderreviews.com'));
  
  return {
    isProduction,
    isPrimaryHost,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
    host: isProduction ? (process.env.HOST || "127.0.0.1") : "0.0.0.0",
    memoryLimit: process.env.MEMORY_LIMIT ? parseInt(process.env.MEMORY_LIMIT, 10) : 256, // MB
    maxConnections: process.env.MAX_CONNECTIONS ? parseInt(process.env.MAX_CONNECTIONS, 10) : 100
  };
}

/**
 * Memory monitoring for shared hosting environments
 */
export function setupMemoryMonitoring() {
  const config = getProductionConfig();
  
  if (!config.isProduction) return;
  
  const checkMemory = () => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    
    console.log(`📊 Memory: ${heapUsedMB}/${heapTotalMB}MB (limit: ${config.memoryLimit}MB)`);
    
    // Warn if approaching memory limit
    if (heapUsedMB > config.memoryLimit * 0.8) {
      console.warn(`⚠️  Memory usage high: ${heapUsedMB}MB (${Math.round(heapUsedMB/config.memoryLimit*100)}%)`);
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('🧹 Running garbage collection...');
        global.gc();
      }
    }
    
    // Exit if memory limit exceeded (let process manager restart)
    if (heapUsedMB > config.memoryLimit * 1.1) {
      console.error(`❌ Memory limit exceeded: ${heapUsedMB}MB > ${config.memoryLimit}MB`);
      process.exit(1);
    }
  };
  
  // Check memory every 30 seconds in production
  setInterval(checkMemory, 30000);
  
  // Initial check
  checkMemory();
}

/**
 * Health check endpoint with environment information
 */
export function createHealthCheck() {
  return (req: express.Request, res: express.Response) => {
    const config = getProductionConfig();
    const usage = process.memoryUsage();
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.round(process.uptime()),
      memory: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        limit: config.memoryLimit
      },
      server: {
        port: config.port,
        host: config.host,
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    };
    
    res.json(health);
  };
}