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

    try {
      await ensureDb();
      await db.insert(inquiries).values(v);
    } catch (dbErr) {
      console.error("DB Save Error:", dbErr);
    }

    // Resend email notification
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: "Upflit Contact <onboarding@resend.dev>",
          to: "egasports181@gmail.com",
          subject: `🛒 New Client Order: ${v.packageName} from ${v.name}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px; max-width: 600px;">
              <h2 style="color: #7357FF; margin-top: 0;">New Client Order (Upflit)</h2>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
              <p><strong>Client Name:</strong> ${v.name}</p>
              <p><strong>Email:</strong> <a href="mailto:${v.email}">${v.email}</a></p>
              <p><strong>Package:</strong> ${v.packageName}</p>
              <p><strong>Service:</strong> ${v.service}</p>
              <p><strong>Budget:</strong> ${v.budget !== "Not specified" ? `$${v.budget}` : "Not specified"}</p>
              <br />
              <p><strong>Project Details / Message:</strong></p>
              <blockquote style="background: #f9f9f9; padding: 12px; border-left: 4px solid #7357FF; margin: 0; border-radius: 4px; white-space: pre-wrap;">
                ${v.message}
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