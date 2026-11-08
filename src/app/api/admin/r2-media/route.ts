import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { mediaMetadata } from "@/db/schema";
import { listR2Objects } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const objects = await listR2Objects();
    const metadataRows = await db.select().from(mediaMetadata);
    const metadataByKey = new Map(metadataRows.map((row) => [row.key, { title: row.title, description: row.description, category: row.category }]));
    const data = objects.map((item) => ({ ...item, metadata: metadataByKey.get(item.key) ?? null }));
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("[upflit r2 media list]", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not list Cloudflare R2 images." }, { status: 500 });
  }
}
