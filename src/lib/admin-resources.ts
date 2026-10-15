
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import {
  categories,
  inquiries,
  items,
  media,
  projects,
} from "@/db/schema";
import {
  getAllCategories,
  getAllItems,
  getAllProjects,
  normalizeProject,
} from "./data";
import type { ItemKind } from "./types";
import {
  ValidationError,
  validateCategory,
  validateItem,
  validateProject,
  ITEM_KINDS,
} from "./validate";

export const RESOURCES = [
  "categories",
  "projects",
  "items",
  "inquiries",
  "media",
] as const;

export type Resource = (typeof RESOURCES)[number];

export const isResource = (r: string): r is Resource =>
  (RESOURCES as readonly string[]).includes(r);

const ok = (data: Record<string, unknown> = {}) =>
  Response.json({ ok: true, ...data });

const fail = (error: string, status = 400) =>
  Response.json({ ok: false, error }, { status });

async function uniqueSlug(base: string, excludeId?: number) {
  let slug = base;

  for (let i = 2; i < 200; i++) {
    const where = excludeId
      ? and(
          eq(projects.slug, slug),
          ne(projects.id, excludeId)
        )
      : eq(projects.slug, slug);

    const rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(where);

    if (!rows.length) return slug;

    slug = `${base}-${i}`;
  }

  return `${base}-${Date.now()}`;
}

async function nextOrder(
  table: typeof categories | typeof projects | typeof items
) {
  const [{ max }] = await db
    .select({
      max: sql<number>`coalesce(max(${table.sortOrder}), -1)::int`,
    })
    .from(table);

  return max + 1;
}

export async function handle(fn: () => Promise<Response>) {
  try {
    await ensureDb();
    return await fn();
  } catch (err) {
    if (err instanceof ValidationError) {
      return fail(err.message, 400);
    }

    console.error("[upflit admin]", err);

    return fail(
      "Server error: the change could not be saved. " +
        ((err as Error).message || ""),
      500
    );
  }
}

export async function listResource(
  resource: Resource,
  url: URL
) {
  switch (resource) {
    case "categories":
      return ok({ data: await getAllCategories() });

    case "projects":
      return ok({ data: await getAllProjects() });

    case "items": {
      const kind = url.searchParams.get("kind") as ItemKind | null;

      return ok({
        data: await getAllItems(
          kind && ITEM_KINDS.includes(kind) ? kind : undefined
        ),
      });
    }

    case "inquiries":
      return ok({
        data: await db
          .select()
          .from(inquiries)
          .orderBy(desc(inquiries.createdAt)),
      });

    case "media": {
      const rows = await db
        .select({
          id: media.id,
          filename: media.filename,
          mime: media.mime,
          size: media.size,
          createdAt: media.createdAt,
        })
        .from(media)
        .orderBy(desc(media.id));

      return ok({
        data: rows.map((r) => ({
          ...r,
          url: `/api/media/${r.id}`,
        })),
      });
    }
  }
}

export async function createResource(
  resource: Resource,
  body: unknown
) {
  switch (resource) {
    case "categories": {
      const v = validateCategory(body);

      const [row] = await db
        .insert(categories)
        .values({
          ...v,
          sortOrder: await nextOrder(categories),
        })
        .returning();

      return ok({ data: row });
    }

    case "projects": {
      const v = validateProject(body);
      v.slug = await uniqueSlug(v.slug);

      const [row] = await db
        .insert(projects)
        .values({
          ...v,
          sortOrder: await nextOrder(projects),
        })
        .returning();

      return ok({ data: normalizeProject(row) });
    }

    case "items": {
      const kind = String(
        (body as { kind?: string })?.kind || ""
      );

      const v = validateItem(kind, body);

      const [row] = await db
        .insert(items)
        .values({
          ...v,
          sortOrder: await nextOrder(items),
        })
        .returning();

      return ok({ data: row });
    }

    default:
      return fail("Not supported.", 405);
  }
}

export async function updateResource(
  resource: Resource,
  id: number,
  body: unknown
) {
  switch (resource) {
    case "categories": {
      const v = validateCategory(body);

      const [row] = await db
        .update(categories)
        .set(v)
        .where(eq(categories.id, id))
        .returning();

      return row
        ? ok({ data: row })
        : fail("Category not found.", 404);
    }

    case "projects": {
      const v = validateProject(body);
      v.slug = await uniqueSlug(v.slug, id);

      const [row] = await db
        .update(projects)
        .set(v)
        .where(eq(projects.id, id))
        .returning();

      return row
        ? ok({ data: normalizeProject(row) })
        : fail("Project not found.", 404);
    }

    case "items": {
      const existing = await db
        .select()
        .from(items)
        .where(eq(items.id, id));

      if (!existing[0]) {
        return fail("Item not found.", 404);
      }

      const v = validateItem(existing[0].kind, body);

      const [row] = await db
        .update(items)
        .set({
          data: v.data,
          visible: v.visible,
        })
        .where(eq(items.id, id))
        .returning();

      return ok({ data: row });
    }

    case "inquiries": {
      const status = String(
        (body as { status?: string })?.status || ""
      );

      if (
        !["new", "read", "replied", "archived"].includes(status)
      ) {
        return fail("Invalid status.");
      }

      const [row] = await db
        .update(inquiries)
        .set({ status })
        .where(eq(inquiries.id, id))
        .returning();

      return row
        ? ok({ data: row })
        : fail("Inquiry not found.", 404);
    }

    default:
      return fail("Not supported.", 405);
  }
}

export async function deleteResource(
  resource: Resource,
  id: number
) {
  const tables = {
    categories,
    projects,
    items,
    inquiries,
    media,
  } as const;

  const table = tables[resource];

  if (resource === "categories") {
    await db
      .update(projects)
      .set({ categoryId: null })
      .where(eq(projects.categoryId, id));
  }

  const rows = await db
    .delete(table)
    .where(eq(table.id, id))
    .returning({ id: table.id });

  return rows.length
    ? ok({ id })
    : fail("Not found.", 404);
}

export async function reorderResource(
  resource: string,
  ids: unknown
) {
  if (
    !["categories", "projects", "items"].includes(resource)
  ) {
    return fail("Cannot reorder this resource.");
  }

  if (
    !Array.isArray(ids) ||
    !ids.every(
      (id) =>
        Number.isSafeInteger(id) &&
        typeof id === "number" &&
        id > 0
    ) ||
    new Set(ids).size !== ids.length
  ) {
    return fail("Invalid order.");
  }

  const table =
    resource === "categories"
      ? categories
      : resource === "projects"
        ? projects
        : items;

  // Sequential updates: no database transaction required.
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(table)
      .set({ sortOrder: i })
      .where(eq(table.id, ids[i] as number));
  }

  return ok();
}
