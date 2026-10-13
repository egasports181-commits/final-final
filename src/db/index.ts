import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[upflit] DATABASE_URL is not set. Falling back to default local URL."
  );
}

// Serverless (Vercel)-er jonno Neon HTTP client setup
const sql = neon(databaseUrl);

// Drizzle database instance export
export const db = drizzle(sql);