import crypto from "node:crypto";
import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { adminUsers } from "@/db/schema";

export const SESSION_COOKIE = "upflit_session";
const SESSION_DAYS = 7;

let warned = false;
function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.warn("[upflit] SESSION_SECRET is missing or too short. Set it in production!");
  }
  return "upflit-dev-secret-change-me-please";
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(userId: number): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_DAYS * 864e5 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): { uid: number } | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: number; exp: number };
    if (!data.uid || data.exp < Date.now()) return null;
    return { uid: data.uid };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "true",
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};

/** Creates the initial admin from ADMIN_EMAIL / ADMIN_PASSWORD if none exists. */
export async function ensureAdmin() {
  await ensureDb();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(adminUsers);
  if (count > 0) return;
  const email = (process.env.ADMIN_EMAIL || "admin@upflit.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "upflit-admin";
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      `[upflit] Created default admin ${email} / upflit-admin — change it in Admin → Account & Security.`,
    );
  }
  await db.insert(adminUsers).values({ email, passwordHash: hashPassword(password) }).onConflictDoNothing();
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const session = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  try {
    await ensureDb();
    const rows = await db.select().from(adminUsers).where(eq(adminUsers.id, session.uid));
    return rows[0] ? { id: rows[0].id, email: rows[0].email } : null;
  } catch {
    return null;
  }
}

export function jsonError(message: string, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

/** Returns an error Response if not authenticated, otherwise null. */
export async function requireAdmin(): Promise<Response | null> {
  const admin = await getCurrentAdmin();
  return admin ? null : jsonError("Unauthorized. Please log in again.", 401);
}
