import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Database configuration - Prefers Supabase but falls back to available database
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ No database connection string found");
  console.log("Available environment variables containing 'DATABASE':");
  Object.keys(process.env).filter(key => key.includes('DATABASE')).forEach(key => {
    console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  });
  throw new Error(
    "Either SUPABASE_DATABASE_URL or DATABASE_URL must be set for database connectivity.",
  );
}

if (process.env.SUPABASE_DATABASE_URL) {
  console.log("🔄 Using Supabase database for all user data storage");
} else {
  console.log("📊 Using fallback database connection");
}

console.log("🔄 Using Supabase database for all user data storage");
// Log connection attempt (without exposing credentials)
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':***@');
console.log("📡 Connecting to:", maskedUrl);

// Configure standard PostgreSQL connection for Supabase
const connectionString = databaseUrl;
export const pool = new Pool({ 
  connectionString,
  // SSL configuration for both development and production
  ssl: process.env.NODE_ENV === 'development' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  // Connection pool settings for production
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
export const db = drizzle(pool, { schema });