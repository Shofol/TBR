import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure NEON for serverless environments
neonConfig.webSocketConstructor = ws;

// Validate required environment variables
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL environment variable is not set");
  throw new Error("DATABASE_URL must be set. Check your environment configuration.");
}

// Validate DATABASE_URL format
try {
  new URL(DATABASE_URL);
} catch (error) {
  console.error("CRITICAL: Invalid DATABASE_URL format:", DATABASE_URL.substring(0, 20) + "...");
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection string");
}

// Create connection pool with timeout and retry configuration
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // Maximum connections
});

export const db = drizzle({ client: pool, schema });

// Test database connection on startup
export async function testDatabaseConnection() {
  try {
    console.log("Testing database connection...");
    const result = await pool.query('SELECT NOW() as current_time');
    console.log("✅ Database connection successful:", result.rows[0]?.current_time);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}