import { requireAdmin } from "@/lib/auth";
import { listR2Objects } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const data = await listR2Objects();
    return Response.json({ ok: true, data });
  } catch (error) {
    console.error("[upflit r2 media list]", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not list Cloudflare R2 images." }, { status: 500 });
  }
}
