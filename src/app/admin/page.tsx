import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, inquiries } from "@/db/schema";
import { getCurrentAdmin, ensureAdmin, verifyPassword } from "@/lib/auth";
import { getAllCategories, getAllItems, getAllProjects, getSettings } from "@/lib/data";
import { AdminApp } from "@/components/admin/AdminApp";
import { LoginForm } from "@/components/admin/LoginForm";
import type { Inquiry } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const { settings, dbOk } = await getSettings();
  const admin = dbOk ? await getCurrentAdmin() : null;

  if (!admin) {
    let usingDefault = false;
    if (dbOk) {
      try {
        await ensureAdmin();
        const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, "admin@upflit.com"));
        usingDefault = !!rows[0] && verifyPassword("upflit-admin", rows[0].passwordHash);
      } catch {
        /* ignore */
      }
    }
    return <LoginForm dbOk={dbOk} usingDefault={usingDefault} />;
  }

  const [projects, categories, items, inq] = await Promise.all([
    getAllProjects(),
    getAllCategories(),
    getAllItems(),
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
  ]);
  const inquiriesList: Inquiry[] = inq.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }));

  return (
    <AdminApp
      initial={{ settings, projects, categories, items, inquiries: inquiriesList, email: admin.email }}
    />
  );
}
