import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getCurrentAdmin, hashPassword, jsonError, verifyPassword } from "@/lib/auth";
import { isEmail } from "@/lib/validate";

export async function POST(req: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) return jsonError("Unauthorized.", 401);
  const body = (await req.json().catch(() => ({}))) as {
    currentPassword?: string;
    newEmail?: string;
    newPassword?: string;
  };
  const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id));
  const user = rows[0];
  if (!user || !verifyPassword(String(body.currentPassword || ""), user.passwordHash)) {
    return jsonError("Current password is incorrect.", 403);
  }
  const update: { email?: string; passwordHash?: string } = {};
  const newEmail = String(body.newEmail || "").toLowerCase().trim();
  if (newEmail && newEmail !== user.email) {
    if (!isEmail(newEmail)) return jsonError("Please enter a valid email.");
    update.email = newEmail;
  }
  if (body.newPassword) {
    if (String(body.newPassword).length < 8) return jsonError("New password must be at least 8 characters.");
    update.passwordHash = hashPassword(String(body.newPassword));
  }
  if (!Object.keys(update).length) return jsonError("Nothing to update.");
  try {
    await db.update(adminUsers).set(update).where(eq(adminUsers.id, admin.id));
  } catch {
    return jsonError("Could not update account (email may already be in use).", 409);
  }
  return Response.json({ ok: true, email: update.email ?? user.email });
}
