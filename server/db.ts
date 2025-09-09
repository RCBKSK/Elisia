import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database connection logic with Supabase support
let databaseUrl = process.env.DATABASE_URL;

if (process.env.SUPABASE_DATABASE_URL) {
  console.log("🔄 Using Supabase database for all user data storage");
  databaseUrl = process.env.SUPABASE_DATABASE_URL;
  
  // Log connection attempt (without exposing credentials)
  const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':***@');
  console.log("📡 Connecting to:", maskedUrl);
} else {
  console.log("📊 Using local Replit database");
}

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure SSL for Supabase/Replit environment
const connectionString = databaseUrl;
export const pool = new Pool({ 
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle({ client: pool, schema });