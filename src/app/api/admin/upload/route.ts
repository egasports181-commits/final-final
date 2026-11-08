import { randomUUID } from "node:crypto";
import { jsonError, requireAdmin } from "@/lib/auth";
import { createR2UploadUrl, getR2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024;
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

  let input: { name?: unknown; type?: unknown; size?: unknown };
  try {
    input = await req.json();
  } catch {
    return jsonError("Invalid upload request.");
  }

  const name = typeof input.name === "string" ? input.name : "";
  const type = typeof input.type === "string" ? input.type : "";
  const size = typeof input.size === "number" ? input.size : 0;

  if (!ALLOWED.has(type)) {
    return jsonError("Unsupported file type. Use JPG, PNG, WebP, GIF, AVIF, SVG or ICO.");
  }
  if (!Number.isFinite(size) || size <= 0) return jsonError("The selected file is empty.");
  if (size > MAX_BYTES) return jsonError("File is too large (max 25 MB).");

  try {
    const safeName = name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(-100) || "image";
    const key = `portfolio/${randomUUID()}-${safeName}`;
    const uploadUrl = await createR2UploadUrl({ key, contentType: type });
    return Response.json({ ok: true, key, uploadUrl, url: getR2PublicUrl(key), contentType: type });
  } catch (err) {
    console.error("[upflit r2 presign]", err);
    return jsonError(
      err instanceof Error ? err.message : "Could not prepare the Cloudflare R2 upload.",
      500,
    );
  }
}
