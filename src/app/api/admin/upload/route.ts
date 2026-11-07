import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { media } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { r2Client, r2Bucket, r2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError("Invalid upload.");
  }

  const file = form.get("file");
  if (!file || typeof file === "string") return jsonError("No file received.");
  const extension = ALLOWED[file.type];
  if (!extension) return jsonError("Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, SVG or ICO.");
  if (file.size <= 0 || file.size > MAX_BYTES) return jsonError("File must be between 1 byte and 8 MB.");

  const publicUrl = r2PublicUrl();
  if (!publicUrl) return jsonError("R2 is not configured. Check the server environment variables.", 503);

  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;

  try {
    const body = Buffer.from(await file.arrayBuffer());
    await r2Client().send(new PutObjectCommand({
      Bucket: r2Bucket(),
      Key: key,
      Body: body,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }));

    await ensureDb();
    const [row] = await db
      .insert(media)
      .values({
        filename: file.name.slice(0, 200) || "upload",
        mime: file.type,
        size: file.size,
        data: null,
        storageKey: key,
      })
      .returning({ id: media.id });

    return Response.json({ ok: true, id: row.id, url: `${publicUrl}/${key}` });
  } catch (err) {
    console.error("[R2 upload]", err);
    return jsonError("Could not upload the image to Cloudflare R2.", 500);
  }
}
