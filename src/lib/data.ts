import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { categories, items, projects, settings } from "@/db/schema";
import { DEFAULT_SETTINGS, sanitizeSettings, type SiteSettings } from "./settings-defaults";
import { sanitizeImage } from "./image";
import type { Category, Item, ItemKind, Project } from "./types";

export function normalizeProject(row: typeof projects.$inferSelect): Project {
  const gallery = Array.isArray(row.gallery) ? row.gallery : [];
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    categoryId: row.categoryId,
    summary: row.summary,
    description: row.description,
    details: Array.isArray(row.details)
      ? (row.details as { label: string; value: string }[]).filter((d) => d && d.label)
      : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]).filter((t) => typeof t === "string") : [],
    cover: sanitizeImage(row.cover),
    gallery: gallery.map((g) => sanitizeImage(g)).filter((g): g is NonNullable<typeof g> => !!g),
    featured: row.featured,
    published: row.published,
    isDemo: row.isDemo,
    sortOrder: row.sortOrder,
  };
}

export async function getSettings(): Promise<{ settings: SiteSettings; dbOk: boolean }> {
  try {
    await ensureDb();
    const rows = await db.select().from(settings).where(eq(settings.key, "site"));
    return { settings: sanitizeSettings(rows[0]?.value ?? DEFAULT_SETTINGS), dbOk: true };
  } catch (err) {
    console.error("[upflit] Could not load settings, using defaults:", (err as Error).message);
    return { settings: sanitizeSettings(DEFAULT_SETTINGS), dbOk: false };
  }
}

export async function getAllCategories(): Promise<Category[]> {
  await ensureDb();
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function getAllProjects(): Promise<Project[]> {
  await ensureDb();
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id));
  return rows.map(normalizeProject);
}

export async function getAllItems(kind?: ItemKind): Promise<Item[]> {
  await ensureDb();
  const q = db.select().from(items);
  const rows = kind
    ? await q.where(eq(items.kind, kind)).orderBy(asc(items.sortOrder), asc(items.id))
    : await q.orderBy(asc(items.sortOrder), asc(items.id));
  return rows.map((r) => ({ ...r, kind: r.kind as ItemKind, data: (r.data ?? {}) as Record<string, unknown> }));
}

export type PublicData = {
  settings: SiteSettings;
  categories: Category[];
  projects: Project[];
  items: Item[];
  dbOk: boolean;
};

export async function getPublicData(): Promise<PublicData> {
  const { settings: s, dbOk } = await getSettings();
  if (!dbOk) return { settings: s, categories: [], projects: [], items: [], dbOk };
  try {
    const [cats, projs, its] = await Promise.all([getAllCategories(), getAllProjects(), getAllItems()]);
    const visibleCats = cats.filter((c) => c.visible);
    return {
      settings: s,
      categories: visibleCats,
      projects: projs.filter((p) => p.published),
      items: its.filter((i) => i.visible),
      dbOk,
    };
  } catch (err) {
    console.error("[upflit] Could not load content:", (err as Error).message);
    return { settings: s, categories: [], projects: [], items: [], dbOk: false };
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    await ensureDb();
    const rows = await db.select().from(projects).where(eq(projects.slug, slug));
    if (!rows[0] || !rows[0].published) return null;
    const project = normalizeProject(rows[0]);
    const cats = await getAllCategories();
    const all = (await getAllProjects()).filter((p) => p.published);
    return { project, categories: cats, all };
  } catch {
    return null;
  }
}
