import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { items, media, projects, settings } from "@/db/schema";
import { putR2Object } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeFilename(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(-100) || "image";
}

function replaceLegacyUrls(value: unknown, urls: Map<number, string>): unknown {
  if (typeof value === "string") {
    return value.replace(/(?:https?:\/\/[^/]+)?\/api\/media\/(\d+)/g, (match, rawId: string) => {
      const replacement = urls.get(Number(rawId));
      return replacement || match;
    });
  }
  if (Array.isArray(value)) return value.map((item) => replaceLegacyUrls(item, urls));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceLegacyUrls(item, urls)]));
  }
  return value;
}

export async function POST() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await ensureDb();
    const oldFiles = await db.select().from(media);
    const urls = new Map<number, string>();

    for (const file of oldFiles) {
      const key = `portfolio/migrated-${file.id}-${safeFilename(file.filename)}`;
      const url = await putR2Object({
        key,
        body: Buffer.from(file.data),
        contentType: file.mime || "application/octet-stream",
      });
      urls.set(file.id, url);
    }

    let projectsUpdated = 0;
    const projectRows = await db.select().from(projects);
    for (const project of projectRows) {
      const cover = replaceLegacyUrls(project.cover, urls);
      const gallery = replaceLegacyUrls(project.gallery, urls);
      if (JSON.stringify(cover) !== JSON.stringify(project.cover) || JSON.stringify(gallery) !== JSON.stringify(project.gallery)) {
        await db.update(projects).set({ cover, gallery }).where(eq(projects.id, project.id));
        projectsUpdated++;
      }
    }

    let settingsUpdated = false;
    const settingsRows = await db.select().from(settings).where(eq(settings.key, "site"));
    if (settingsRows[0]) {
      const value = replaceLegacyUrls(settingsRows[0].value, urls);
      settingsUpdated = JSON.stringify(value) !== JSON.stringify(settingsRows[0].value);
      if (settingsUpdated) await db.update(settings).set({ value }).where(eq(settings.key, "site"));
    }

    let itemsUpdated = 0;
    const itemRows = await db.select().from(items);
    for (const item of itemRows) {
      const data = replaceLegacyUrls(item.data, urls);
      if (JSON.stringify(data) !== JSON.stringify(item.data)) {
        await db.update(items).set({ data }).where(eq(items.id, item.id));
        itemsUpdated++;
      }
    }

    return Response.json({
      ok: true,
      data: {
        mediaFilesCopied: urls.size,
        projectsUpdated,
        itemsUpdated,
        settingsUpdated,
        oldDatabaseFilesKept: true,
      },
    });
  } catch (error) {
    console.error("[upflit r2 media migration]", error);
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Could not migrate legacy images to Cloudflare R2." }, { status: 500 });
  }
}
