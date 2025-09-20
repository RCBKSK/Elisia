import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Replit database configuration - Optimized for Replit environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. This project uses Replit's built-in PostgreSQL database for data storage.",
  );
}

console.log("🔄 Using Replit database for all user data storage");
// Log connection attempt (without exposing credentials)
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':***@');
console.log("📡 Connecting to:", maskedUrl);

// Configure postgres-js client for Replit environment
export const client = postgres(databaseUrl, {
  // Enable prepared statements for better performance in Replit
  prepare: true,
  // SSL configuration for secure connections
  ssl: 'prefer',
  // Connection timeout settings optimized for Replit
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
  connect_timeout: 10, // 10 seconds
  // Connection count optimized for Replit
  max: process.env.NODE_ENV === 'production' ? 3 : 5,
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