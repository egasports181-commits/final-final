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

// Localhost না হলে রিমোট ডাটাবেসের জন্য অটোমেটিক SSL এনাবল করা হয়েছে
const isLocalhost = databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");
const needsSsl =
  !isLocalhost ||
  /sslmode=require/.test(databaseUrl) ||
  process.env.DATABASE_SSL === "true";

export const pool =
  globalForDb.__upflitPool ??
  new Pool({
    connectionString: databaseUrl,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
    max: process.env.NODE_ENV === "production" ? 1 : 8, // Serverless-এ 1 কানেকশন মোড
    connectionTimeoutMillis: 5000, // টাইমাউট না ঝুলে ৫ সেকেন্ডে রেসপন্স করবে
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__upflitPool = pool;
}

export const db = drizzle(pool);