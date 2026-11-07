import { randomUUID } from "node:crypto";
import { jsonError, requireAdmin } from "@/lib/auth";
import { putR2Object } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

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
  if (!ALLOWED.has(file.type)) {
    return jsonError("Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, SVG or ICO.");
  }
  if (file.size <= 0) return jsonError("The selected file is empty.");
  if (file.size > MAX_BYTES) return jsonError("File is too large (max 8 MB).");

  try {
    const safeName = file.name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(-100) || "image";
    const key = `portfolio/${randomUUID()}-${safeName}`;
    const body = Buffer.from(await file.arrayBuffer());
    const url = await putR2Object({ key, body, contentType: file.type });
    return Response.json({ ok: true, key, url });
  } catch (err) {
    console.error("[upflit r2 upload]", err);
    return jsonError(
      err instanceof Error ? err.message : "Could not upload the image to Cloudflare R2.",
      500,
    );
  }
}
