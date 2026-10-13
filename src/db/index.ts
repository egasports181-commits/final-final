import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn("[upflit] DATABASE_URL is not set. Falling back to localhost");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql);