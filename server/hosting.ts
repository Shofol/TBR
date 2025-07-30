/**
 * Third-party hosting compatibility utilities
 * Handles specific requirements for FastComet, Passenger, and other shared hosting providers
 */

/**
 * Detect hosting environment and adjust configuration accordingly
 */
export function detectHostingEnvironment() {
  const env = {
    isReplit: !!process.env.REPL_ID,
    isVercel: !!process.env.VERCEL,
    isNetlify: !!process.env.NETLIFY,
    isHeroku: !!process.env.DYNO,
    isPassenger: !!process.env.PASSENGER_SPAWN_METHOD,
    isFastComet: process.env.HOSTING_PROVIDER === 'fastcomet' || 
                 process.env.SERVER_SOFTWARE?.includes('LiteSpeed') ||
                 process.env.SERVER_SOFTWARE?.includes('Apache'),
    isSharedHosting: !process.env.REPL_ID && !process.env.VERCEL && !process.env.NETLIFY && !process.env.DYNO
  };

  console.log('🔍 Detected hosting environment:', 
    Object.entries(env).filter(([, value]) => value).map(([key]) => key).join(', ') || 'unknown'
  );

  return env;
}

/**
 * Get optimal server configuration for detected hosting environment
 */
export function getHostingConfig() {
  const hostingEnv = detectHostingEnvironment();
  const isProduction = process.env.NODE_ENV === 'production';

  let config = {
    // Default configuration
    host: isProduction ? '127.0.0.1' : '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    maxConnections: 100,
    keepAliveTimeout: 5000,
    headersTimeout: 60000,
    requestTimeout: 120000,
    gracefulShutdownTimeout: 10000
  };

  // Adjust for specific hosting environments
  if (hostingEnv.isPassenger || hostingEnv.isFastComet) {
    // Passenger/FastComet specific optimizations
    config = {
      ...config,
      host: '127.0.0.1', // Passenger binds to localhost
      maxConnections: 50, // Conservative for shared hosting
      keepAliveTimeout: 2000, // Shorter keep-alive for shared resources
      headersTimeout: 30000, // Shorter timeout for shared hosting
      requestTimeout: 60000,
      gracefulShutdownTimeout: 5000 // Faster shutdown for passenger
    };
  } else if (hostingEnv.isReplit) {
    // Replit specific configuration
    config = {
      ...config,
      host: '0.0.0.0', // Replit requires binding to all interfaces
      port: 3000, // Use port 3000 to avoid conflicts
      maxConnections: 100,
      keepAliveTimeout: 5000
    };
  } else if (hostingEnv.isVercel || hostingEnv.isNetlify) {
    // Serverless platforms
    config = {
      ...config,
      maxConnections: 1000, // Higher for serverless
      keepAliveTimeout: 0, // Disable keep-alive for serverless
      gracefulShutdownTimeout: 1000 // Fast shutdown for serverless
    };
  }

  return { config, hostingEnv };
}

/**
 * Apply hosting-specific server optimizations
 */
export function optimizeForHosting(server: any): any {
  const { config, hostingEnv } = getHostingConfig();

  // Set server timeouts
  server.keepAliveTimeout = config.keepAliveTimeout;
  server.headersTimeout = config.headersTimeout;
  server.requestTimeout = config.requestTimeout;
  server.maxConnections = config.maxConnections;

  // Hosting-specific optimizations
  if (hostingEnv.isPassenger || hostingEnv.isFastComet) {
    // Optimize for shared hosting
    server.timeout = 30000; // 30 second timeout
    
    // Handle Passenger-specific signals
    process.on('SIGUSR1', () => {
      console.log('📡 Received SIGUSR1 (Passenger shutdown request)');
      gracefulShutdown(server, 'SIGUSR1');
    });
  }

  console.log('⚙️  Applied hosting optimizations:', {
    maxConnections: config.maxConnections,
    keepAliveTimeout: config.keepAliveTimeout,
    headersTimeout: config.headersTimeout,
    environment: Object.entries(hostingEnv).filter(([, v]) => v).map(([k]) => k).join(', ')
  });

  return config;
}

/**
 * Graceful shutdown handler optimized for different hosting environments
 */
export function gracefulShutdown(server: any, signal: string): void {
  const { config } = getHostingConfig();
  
  console.log(`\n⚠️  Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log("✅ HTTP server closed.");
    
    // Close database connections if available
    if (typeof global !== 'undefined' && (global as any).dbPool) {
      console.log("🔌 Closing database connections...");
      (global as any).dbPool.end();
    }
    
    process.exit(0);
  });
  
  // Force exit after timeout if graceful shutdown fails
  setTimeout(() => {
    console.error(`❌ Forced shutdown after ${config.gracefulShutdownTimeout}ms timeout`);
    process.exit(1);
  }, config.gracefulShutdownTimeout);
}

/**
 * Environment-specific error handling
 */
export function setupErrorHandling(hostingEnv: any): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    
    if (hostingEnv.isProduction || hostingEnv.isPassenger || hostingEnv.isFastComet) {
      // In production/shared hosting, exit to let process manager restart
      console.error('💀 Exiting due to uncaught exception in production environment');
      process.exit(1);
    } else {
      // In development, log but continue
      console.warn('⚠️  Continuing in development mode despite uncaught exception');
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    
    if (hostingEnv.isProduction || hostingEnv.isPassenger || hostingEnv.isFastComet) {
      console.error('💀 Exiting due to unhandled rejection in production environment');
      process.exit(1);
    }
  });

  // Handle memory warnings (Node.js specific)
  process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
      console.warn('⚠️  Memory warning:', warning.message);
    }
  });
}