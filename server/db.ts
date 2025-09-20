import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// SUPABASE-ONLY database configuration - Optimized for serverless deployment
const databaseUrl = process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL must be set. This project exclusively uses Supabase for data storage. No local database is supported.",
  );
}

console.log("🔄 Using Supabase database for all user data storage");
// Log connection attempt (without exposing credentials)
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':***@');
console.log("📡 Connecting to:", maskedUrl);

// Configure postgres-js client for serverless deployment (Render.com compatible)
export const client = postgres(databaseUrl, {
  // CRITICAL: Disable prepared statements for Supabase Transaction pooler
  prepare: false,
  // SSL configuration for production deployment
  ssl: 'require',
  // Connection timeout settings optimized for serverless
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
  connect_timeout: 10, // 10 seconds
  // Reduce connection count for serverless
  max: process.env.NODE_ENV === 'production' ? 1 : 5,
});

export const db = drizzle(client, { schema });

// Ensure proper connection cleanup on process exit (important for serverless)
process.on('SIGINT', () => {
  console.log('🔄 Closing database connection...');
  client.end();
});

process.on('SIGTERM', () => {
  console.log('🔄 Closing database connection...');
  client.end();
});