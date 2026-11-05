import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { privatePortfolios } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/settings-defaults";
import { sanitizeImage } from "@/lib/image";

function parseBody(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const body = input as Record<string, unknown>;
  const rawSlug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!rawSlug) return null;
  const slug = slugify(rawSlug);
  if (!slug || slug === "item" && rawSlug.toLowerCase() !== "item") return null;

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
    sortOrder: Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0,
  };
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  await ensureDb();
  const data = await db.select().from(privatePortfolios).orderBy(asc(privatePortfolios.sortOrder), asc(privatePortfolios.id));
  return Response.json({ ok: true, data: data.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })) });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  await ensureDb();
  const body = await req.json().catch(() => null);
  const value = parseBody(body);
  if (!value) return jsonError("Add a valid URL slug and use valid images (maximum 100 images).");
  const existing = await db.select({ id: privatePortfolios.id }).from(privatePortfolios).where(eq(privatePortfolios.slug, value.slug));
  if (existing.length) return jsonError("This URL slug is already in use. Choose another one.", 409);
  const [row] = await db.insert(privatePortfolios).values(value).returning();
  return Response.json({ ok: true, data: { ...row, createdAt: row.createdAt.toISOString() } });
}
