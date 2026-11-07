import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { media } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { r2Bucket, r2Client, r2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!r2PublicUrl()) return jsonError("R2 is not configured. Check the server environment variables.", 503);

  try {
    await ensureDb();
    const batch = await db.select().from(media).where(isNotNull(media.data)).limit(10);
    let migrated = 0;

    for (const file of batch) {
      if (!file.data) continue;
      const extension = EXTENSIONS[file.mime] || "bin";
      const key = `uploads/legacy/${file.id}-${randomUUID()}.${extension}`;

      await r2Client().send(new PutObjectCommand({
        Bucket: r2Bucket(),
        Key: key,
        Body: file.data,
        ContentType: file.mime,
        CacheControl: "public, max-age=31536000, immutable",
      }));

      await db.update(media).set({ storageKey: key, data: null }).where(eq(media.id, file.id));
      migrated++;
    }

    const remaining = await db.select({ id: media.id }).from(media).where(isNotNull(media.data)).limit(1);
    return Response.json({ ok: true, migrated, hasMore: remaining.length > 0 });
  } catch (err) {
    console.error("[R2 legacy media migration]", err);
    return jsonError("Some legacy images could not be migrated. Successfully migrated images remain safe; try again.", 500);
  }
}
