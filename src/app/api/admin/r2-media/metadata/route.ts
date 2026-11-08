import { db } from "@/db";
import { categories, mediaMetadata } from "@/db/schema";
import { jsonError, requireAdmin } from "@/lib/auth";
import { ensureDb } from "@/db/init";
import { getR2KeyFromPublicUrl } from "@/lib/r2";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

type GeneratedMetadata = { title: string; description: string; category: string };

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return jsonError("GEMINI_API_KEY is missing from the server environment.", 503);

  let body: { url?: unknown; mimeType?: unknown };
  try { body = await req.json(); } catch { return jsonError("Invalid metadata request."); }

  const url = typeof body.url === "string" ? body.url : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const key = getR2KeyFromPublicUrl(url);
  if (!key) return jsonError("This image URL is not a valid Upflit R2 portfolio URL.");
  if (!MIME_TYPES.has(mimeType)) return jsonError("AI metadata supports JPG, PNG, WebP, GIF and AVIF images only.");

  try {
    await ensureDb();
    const categoryRows = await db.select({ name: categories.name }).from(categories);
    const categoryNames = categoryRows.map((item) => item.name);
    const imageResponse = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000) });
    if (!imageResponse.ok) return jsonError("Could not read the uploaded R2 image.", 502);
    const responseType = (imageResponse.headers.get("content-type") || "").split(";")[0].toLowerCase();
    if (!MIME_TYPES.has(responseType)) return jsonError("R2 returned an unsupported image type.", 415);
    const declaredLength = Number(imageResponse.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) return jsonError("AI analysis is limited to images up to 8 MB.", 413);
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return jsonError("AI analysis is limited to images up to 8 MB.", 413);

    const prompt = [
      "Analyze this portfolio image and create concise, accurate metadata for a creative design studio website.",
      "Return only valid JSON with exactly three string fields: title, description, category.",
      "Title: clear, specific, natural, 3-8 words. Do not invent a client or brand name.",
      "Description: one useful sentence describing only visible content, design style and likely design format. Avoid exaggerated marketing claims.",
      categoryNames.length
        ? "Choose category from this exact list when one fits: " + categoryNames.join(", ") + ". If none fits, use Other Creative Work."
        : "Choose a short, sensible design category such as Logo Design, Thumbnail Design, Flyer Design, or Other Creative Work.",
      "Do not mention AI, image analysis, or unseen context."
    ].join("\n");

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [
          { inlineData: { mimeType: responseType, data: bytes.toString("base64") } },
          { text: prompt }
        ] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseJsonSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              category: { type: "STRING" }
            },
            required: ["title", "description", "category"],
            propertyOrdering: ["title", "description", "category"]
          }
        }
      }),
      signal: AbortSignal.timeout(18000)
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("[upflit gemini metadata]", aiResponse.status, detail.slice(0, 1200));
      let providerMessage = "Gemini could not generate metadata. Check API key, model access and quota.";
      try {
        const parsed = JSON.parse(detail);
        providerMessage = parsed?.error?.message || providerMessage;
      } catch {}
      return jsonError(
        aiResponse.status === 429 ? "Gemini free-tier rate limit reached. Try again later." : `Gemini API error (${aiResponse.status}): ${providerMessage}`,
        aiResponse.status === 429 ? 429 : 502,
      );
    }

    const result = await aiResponse.json();
    const raw = result?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (!raw) return jsonError("Gemini returned an empty metadata response.", 502);
    let generated: GeneratedMetadata;
    try { generated = JSON.parse(raw); } catch { return jsonError("Gemini returned invalid JSON. Please retry.", 502); }

    const metadata = {
      title: String(generated.title || "").trim().slice(0, 120),
      description: String(generated.description || "").trim().slice(0, 500),
      category: String(generated.category || "").trim().slice(0, 80)
    };
    if (!metadata.title || !metadata.description || !metadata.category) return jsonError("Gemini returned incomplete metadata. Please retry.", 502);

    await db.insert(mediaMetadata).values({ key, ...metadata })
      .onConflictDoUpdate({ target: mediaMetadata.key, set: { ...metadata, updatedAt: new Date() } });
    return Response.json({ ok: true, data: { key, ...metadata } });
  } catch (error) {
    console.error("[upflit image metadata]", error);
    return jsonError(error instanceof Error ? error.message : "Could not generate image metadata.", 500);
  }
}
