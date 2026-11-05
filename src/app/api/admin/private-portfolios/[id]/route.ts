import { eq, ne, and } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { privatePortfolios } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/settings-defaults";
import { sanitizeImage } from "@/lib/image";

type Context = { params: Promise<{ id: string }> };

async function getId(ctx: Context) {
  const { id } = await ctx.params;
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function parseBody(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!rawSlug) return null;
  const slug = slugify(rawSlug);
  if (!slug || (slug === "item" && rawSlug.toLowerCase() !== "item")) return null;

  const rawImages = Array.isArray(body.images) ? body.images : [];
  if (rawImages.length > 100) return null;
  const images = rawImages
    .map((image) => sanitizeImage(image, "16:9"))
    .filter((image): image is NonNullable<typeof image> => !!image);
  if (images.length !== rawImages.length) return null;

  return {
    slug,
    title: typeof body.title === "string" ? body.title.trim().slice(0, 160) : "",
    description: typeof body.description === "string" ? body.description.trim().slice(0, 3000) : "",
    images,
    published: typeof body.published === "boolean" ? body.published : true,
  };
}

export async function PUT(req: Request, ctx: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = await getId(ctx);
  if (!id) return jsonError("Portfolio not found.", 404);
  await ensureDb();
  const body = await req.json().catch(() => null);
  const value = parseBody(body);
  if (!value) return jsonError("Add a valid URL slug and use valid images (maximum 100 images).");
  const existing = await db
    .select({ id: privatePortfolios.id })
    .from(privatePortfolios)
    .where(and(eq(privatePortfolios.slug, value.slug), ne(privatePortfolios.id, id)));
  if (existing.length) return jsonError("This URL slug is already in use. Choose another one.", 409);
  const [row] = await db
    .update(privatePortfolios)
    .set(value)
    .where(eq(privatePortfolios.id, id))
    .returning();
  if (!row) return jsonError("Portfolio not found.", 404);
  return Response.json({ ok: true, data: { ...row, createdAt: row.createdAt.toISOString() } });
}

export async function DELETE(_req: Request, ctx: Context) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = await getId(ctx);
  if (!id) return jsonError("Portfolio not found.", 404);
  await ensureDb();
  const rows = await db.delete(privatePortfolios).where(eq(privatePortfolios.id, id)).returning({ id: privatePortfolios.id });
  return rows.length
    ? Response.json({ ok: true, id })
    : jsonError("Portfolio not found.", 404);
}
