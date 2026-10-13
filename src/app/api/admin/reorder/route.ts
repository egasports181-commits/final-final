import { requireAdmin, jsonError } from "@/lib/auth";
import { handle, reorderResource } from "@/lib/admin-resources";

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => null)) as { resource?: string; ids?: unknown } | null;
  if (!body) return jsonError("Invalid JSON body.");
  return handle(() => reorderResource(String(body.resource || ""), body.ids));
}
