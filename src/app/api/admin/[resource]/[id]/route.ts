import { requireAdmin, jsonError } from "@/lib/auth";
import { deleteResource, handle, isResource, updateResource } from "@/lib/admin-resources";

type Ctx = { params: Promise<{ resource: string; id: string }> };

async function parse(ctx: Ctx) {
  const { resource, id } = await ctx.params;
  const num = Number(id);
  if (!isResource(resource) || !Number.isInteger(num)) return null;
  return { resource, id: num };
}

export async function PUT(req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = await parse(ctx);
  if (!p) return jsonError("Not found.", 404);
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body.");
  return handle(() => updateResource(p.resource, p.id, body));
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = await parse(ctx);
  if (!p) return jsonError("Not found.", 404);
  return handle(() => deleteResource(p.resource, p.id));
}
