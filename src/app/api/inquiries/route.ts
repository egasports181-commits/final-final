import { Resend } from "resend";
import { db } from "@/db";
import { ensureDb } from "@/db/init";
import { inquiries } from "@/db/schema";
import { ValidationError, validateInquiry } from "@/lib/validate";

const recent = new Map<string, number[]>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 5) {
    return Response.json({ ok: false, error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  if (body.website) return Response.json({ ok: true }); // honeypot

  try {
    const v = validateInquiry(body);
    await ensureDb();
    await db.insert(inquiries).values(v);

    // Resend email notification (Safe Initialization for Vercel Build)
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: "Upflit Contact <onboarding@resend.dev>",
          to: "egasports181@gmail.com",
          subject: `New Inquiry from ${v.name || "Website Visitor"}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #7357FF;">New Inquiry Received (Upflit)</h2>
              <p><strong>Name:</strong> ${v.name || "N/A"}</p>
              <p><strong>Email:</strong> ${v.email || "N/A"}</p>
              <p><strong>Message:</strong></p>
              <blockquote style="background: #f9f9f9; padding: 12px; border-left: 4px solid #7357FF; margin: 0;">
                ${v.message || "N/A"}
              </blockquote>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Resend Email Error:", emailErr);
      }
    }

    hits.push(now);
    recent.set(ip, hits);
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error(err);
    return Response.json(
      { ok: false, error: "We couldn't send your message right now. Please email us directly." },
      { status: 500 },
    );
  }
}