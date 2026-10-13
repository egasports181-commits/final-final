import { neon, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

if (!process.env.DATABASE_URL) {
  console.warn("[upflit] DATABASE_URL is not set. Falling back to localhost");
}

// pool এবং db দুটোই এক্সপোর্ট করা হলো যাতে অন্য ফাইলে কোনো এরর না আসে
export const pool = new Pool({ connectionString: databaseUrl });
const sql = neon(databaseUrl);
export const db = drizzle(sql);