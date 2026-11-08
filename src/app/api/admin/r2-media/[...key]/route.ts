import { requireAdmin } from "@/lib/auth";
import { deleteR2Object } from "@/lib/r2";

export const runtime = "nodejs";

export async function DELETE(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { key: parts } = await ctx.params;
  const key = Array.isArray(parts) ? parts.join("/") : "";
  if (!key.startsWith("portfolio/") || key.split("/").some((part) => !part || part === "." || part === "..")) {
    return Response.json({ ok: false, error: "Invalid R2 object key." }, { status: 400 });
  }

  try {
    await deleteR2Object(key);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[upflit r2 media delete]", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not delete the R2 image." }, { status: 500 });
  }
}
