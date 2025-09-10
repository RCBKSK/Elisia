import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Enforce Supabase-only database configuration
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. This project exclusively uses Supabase for data storage.",
  );
}

console.log("🔄 Using Supabase database for all user data storage");
// Log connection attempt (without exposing credentials)
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':***@');
console.log("📡 Connecting to:", maskedUrl);

// Configure standard PostgreSQL connection for Supabase
const connectionString = databaseUrl;
export const pool = new Pool({ 
  connectionString,
  ssl: { rejectUnauthorized: false } // Supabase requires SSL
});
export const db = drizzle(pool, { schema });