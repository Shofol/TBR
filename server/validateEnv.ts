/**
 * Environment Variable Validation for Production Deployment
 * Ensures all required environment variables are set before server startup
 */

interface RequiredEnvVars {
  DATABASE_URL: string;
  NODE_ENV: string;
  JWT_SECRET: string;
}

interface OptionalEnvVars {
  PORT?: string;
  JWT_EXPIRY?: string;
  SMTP_HOST?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  ADMIN_EMAIL?: string;
  ALLOWED_ORIGINS?: string;
}

export function validateEnvironmentVariables(): RequiredEnvVars & OptionalEnvVars {
  const errors: string[] = [];
  
  // Required variables
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    errors.push("DATABASE_URL is required. Please set your PostgreSQL connection string.");
  } else {
    try {
      new URL(DATABASE_URL);
    } catch {
      errors.push("DATABASE_URL must be a valid PostgreSQL connection string.");
    }
  }
  
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'development' ? 'development-jwt-secret-key-at-least-32-characters-long' : '');
  if (!JWT_SECRET) {
    errors.push("JWT_SECRET is required. Please set a secure random string (minimum 32 characters).");
  } else if (JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters long for security.");
  } else if (NODE_ENV === 'production' && JWT_SECRET.includes('development')) {
    errors.push("JWT_SECRET must be changed from the default development key in production.");
  }
  
  // Optional variables with validation
  const PORT = process.env.PORT;
  if (PORT && (isNaN(Number(PORT)) || Number(PORT) < 1 || Number(PORT) > 65535)) {
    errors.push("PORT must be a valid port number between 1 and 65535.");
  }
  
  // Email configuration validation (all or none)
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
  
  if ((SMTP_HOST || SMTP_USER || SMTP_PASSWORD) && !(SMTP_HOST && SMTP_USER && SMTP_PASSWORD)) {
    errors.push("If using SMTP email, all of SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be set.");
  }
  
  if (errors.length > 0) {
    console.error("❌ Environment Configuration Errors:");
    errors.forEach(error => console.error(`  - ${error}`));
    console.error("\nPlease check your .env file or environment variable configuration.");
    process.exit(1);
  }
  
  console.log("✅ Environment variables validated successfully");
  
  return {
    DATABASE_URL: DATABASE_URL!,
    NODE_ENV,
    JWT_SECRET: JWT_SECRET!,
    PORT,
    JWT_EXPIRY: process.env.JWT_EXPIRY,
    SMTP_HOST,
    SMTP_USER,
    SMTP_PASSWORD,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
  };
}