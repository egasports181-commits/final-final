import { db } from "@/db";
import { settings } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { sanitizeSettings } from "@/lib/settings-defaults";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { settings: s, dbOk } = await getSettings();
  if (!dbOk) return jsonError("Database unavailable.", 503);
  return Response.json({ ok: true, settings: s });
}

export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || !("settings" in body)) return jsonError("Invalid settings payload.");
  const clean = sanitizeSettings((body as { settings: unknown }).settings);
  try {
    await db
      .insert(settings)
      .values({ key: "site", value: clean })
      .onConflictDoUpdate({ target: settings.key, set: { value: clean, updatedAt: new Date() } });
  } catch (err) {
    console.error(err);
    return jsonError("Could not save settings to the database.", 500);
  }
  return Response.json({ ok: true, settings: clean });
}
