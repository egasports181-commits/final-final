import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("[upflit] DATABASE_URL environment variable is missing!");
}

const globalForDb = globalThis as typeof globalThis & {
  __upflitPool?: Pool;
};

// Neon DB Serverless-এর জন্য SSL ও Connection Pool Settings (init.ts-এর সাথে সামঞ্জস্যপূর্ণ)
export const pool =
  globalForDb.__upflitPool ??
  new Pool({
    connectionString:
      databaseUrl ||
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
    ssl: databaseUrl ? { rejectUnauthorized: false } : undefined,
    max: 1, // Serverless-এ কানেকশন ঝুলন্ত হওয়া আটকাবে
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__upflitPool = pool;
}

export const db = drizzle(pool);