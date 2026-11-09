import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await ensureDb();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[upflit] health check failed", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
