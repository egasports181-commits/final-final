import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { media } from "@/db/schema";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const num = Number(id);
  if (!Number.isInteger(num)) return new Response("Not found", { status: 404 });
  try {
    await ensureDb();
    const rows = await db.select().from(media).where(eq(media.id, num));
    const file = rows[0];
    if (!file) return new Response("Not found", { status: 404 });
    const headers: Record<string, string> = {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.data.length),
    };
    if (file.mime === "image/svg+xml") headers["Content-Security-Policy"] = "script-src 'none'";
    return new Response(new Uint8Array(file.data), { headers });
  } catch {
    return new Response("Unavailable", { status: 503 });
  }
}
