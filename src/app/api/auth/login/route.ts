import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import {
  createSessionToken,
  ensureAdmin,
  jsonError,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.");
  }
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  if (!email || !password) return jsonError("Email and password are required.");
  try {
    await ensureAdmin();
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    const user = rows[0];
    if (!user || !verifyPassword(password, user.passwordHash)) {
      await new Promise((r) => setTimeout(r, 400));
      return jsonError("Incorrect email or password.", 401);
    }
    const store = await cookies();
    store.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return jsonError("Database unavailable. Check DATABASE_URL and that PostgreSQL is running.", 503);
  }
}
