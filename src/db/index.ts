import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[upflit] DATABASE_URL is not set. Falling back to postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __upflitPool?: Pool;
};

const needsSsl =
  /sslmode=require/.test(databaseUrl) || process.env.DATABASE_SSL === "true";

export const pool =
  globalForDb.__upflitPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: 8,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__upflitPool = pool;
}

export const db = drizzle(pool);
