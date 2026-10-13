import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn("[upflit] DATABASE_URL is not set in Environment Variables.");
}

// Neon HTTP client (Vercel Serverless-এ ১০০% দ্রুত ও টাইমাউট-ফ্রি)
export const sql = neon(databaseUrl);

// Drizzle DB Instance
export const db = drizzle({ client: sql });

// init.ts-এর জন্য pool সাপোর্ট রাখা হলো যাতে বিল্ড এরর না হয়
export const pool = {
  query: (queryText: string, params?: any[]) => sql(queryText, params),
  end: async () => {},
};