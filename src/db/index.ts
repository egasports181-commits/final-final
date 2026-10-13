import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[upflit] DATABASE_URL is not set. Falling back to default local URL."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __upflitPool?: Pool;
};

// Neon Serverless Pool instance (Vercel-এ Timeout হওয়া থেকে রক্ষা করে)
export const pool =
  globalForDb.__upflitPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__upflitPool = pool;
}

// Drizzle instance with Neon Serverless Pool
export const db = drizzle(pool);