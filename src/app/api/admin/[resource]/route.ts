import { requireAdmin, jsonError } from "@/lib/auth";
import { createResource, handle, isResource, listResource } from "@/lib/admin-resources";

export async function GET(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { resource } = await ctx.params;
  if (!isResource(resource)) return jsonError("Unknown resource.", 404);
  return handle(() => listResource(resource, new URL(req.url)));
}

export async function POST(req: Request, ctx: { params: Promise<{ resource: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { resource } = await ctx.params;
  if (!isResource(resource)) return jsonError("Unknown resource.", 404);
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid JSON body.");
  return handle(() => createResource(resource, body));
}
