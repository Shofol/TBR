import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { addDebugLog, debugEndpointHandler } from "./diagnostics";

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// CRITICAL: Debug endpoint must be registered FIRST to work even when other routes fail
// This endpoint works independently of the main application
app.get('/__debug', debugEndpointHandler);

// Initialize debug logging
addDebugLog('info', 'TubeBenderReviews server starting up', 'startup');

// CORS configuration for FastComet deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://tubebenderreviews.com',
    'https://www.tubebenderreviews.com',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://0.0.0.0:5000'
  ];
  
  if (allowedOrigins.includes(origin || '') || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Security middleware with production-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false // Disable for compatibility
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Enhanced logging middleware with debug integration
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // Log to debug system for all requests
    if (path !== '/__debug') { // Avoid logging debug endpoint calls to prevent recursion
      addDebugLog('debug', `${req.method} ${path} ${res.statusCode} (${duration}ms)`, 'http');
    }
    
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      // Log API errors to debug system
      if (res.statusCode >= 400) {
        addDebugLog('error', `API Error: ${req.method} ${path} returned ${res.statusCode}`, 'api');
      }
    }
  });

  next();
});

(async () => {
  try {
    addDebugLog('info', 'Starting server initialization', 'startup');
    
    // Validate environment variables first
    const { validateEnvironmentVariables } = await import("./validateEnv");
    validateEnvironmentVariables();
    addDebugLog('info', 'Environment variables validated', 'startup');
    
    // Test database connection
    const { testDatabaseConnection } = await import("./db");
    await testDatabaseConnection();
    addDebugLog('info', 'Database connection verified', 'startup');
    
    const server = await registerRoutes(app);
    
    // Seed database if needed
    const { seedDatabase } = await import("./seed");
    await seedDatabase();
    addDebugLog('info', 'Database seeding completed', 'startup');
    
    console.log("✅ Server initialization completed successfully");
    addDebugLog('info', 'Server initialization completed successfully', 'startup');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup development or production file serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Enhanced production static file serving with fallbacks
    const { serveStaticFiles, setupMemoryMonitoring, createHealthCheck } = await import("./production");
    
    // Setup memory monitoring for shared hosting
    setupMemoryMonitoring();
    
    // Enhanced health check endpoint
    app.get("/api/health", createHealthCheck());
    
    // Serve static files with multiple fallback locations
    serveStaticFiles(app);
  }

    // Enhanced hosting environment detection and configuration
    const { getHostingConfig, optimizeForHosting, gracefulShutdown, setupErrorHandling } = await import("./hosting");
    const { config, hostingEnv } = getHostingConfig();
    
    // Apply hosting-specific optimizations
    optimizeForHosting(server);
    
    // Setup environment-specific error handling
    setupErrorHandling(hostingEnv);
    
    // Register shutdown handlers
    const shutdownHandler = (signal: string) => gracefulShutdown(server, signal);
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // nodemon restart
    
    // Start server with hosting-optimized configuration
    server.listen(config.port, config.host, () => {
      const env = process.env.NODE_ENV || 'development';
      log(`🚀 Server running on ${config.host}:${config.port} (${env})`);
      log(`📊 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      log(`🏠 Hosting: ${Object.entries(hostingEnv).filter(([, v]) => v).map(([k]) => k).join(', ') || 'unknown'}`);
      log(`🔧 Debug endpoint available at: http://${config.host}:${config.port}/__debug`);
      
      addDebugLog('info', `Server started on ${config.host}:${config.port}`, 'startup');
      addDebugLog('info', `Debug mode enabled - diagnostics available at /__debug`, 'startup');
    });
    
    // Enhanced server startup error handling
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.port} is already in use`);
        if (hostingEnv.isPassenger || hostingEnv.isFastComet) {
          console.error('💡 This may be normal for Passenger - it manages port assignment');
        }
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied for port ${config.port}`);
        if (hostingEnv.isFastComet) {
          console.error('💡 Check cPanel Node.js App configuration for correct port assignment');
        }
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    addDebugLog('error', `Server startup failed: ${error}`, 'startup');
    process.exit(1);
  }
})();
