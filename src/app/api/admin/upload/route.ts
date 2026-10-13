import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { media } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif", "image/x-icon", "image/vnd.microsoft.icon"];

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
  if (!ALLOWED.includes(file.type)) return jsonError("Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, SVG or ICO.");
  if (file.size > MAX_BYTES) return jsonError("File is too large (max 8 MB).");
  try {
    await ensureDb();
    const buffer = Buffer.from(await file.arrayBuffer());
    const [row] = await db
      .insert(media)
      .values({ filename: file.name.slice(0, 200) || "upload", mime: file.type, size: file.size, data: buffer })
      .returning({ id: media.id });
    return Response.json({ ok: true, id: row.id, url: `/api/media/${row.id}` });
  } catch (err) {
    console.error(err);
    return jsonError("Could not store the image in the database.", 500);
  }
}
