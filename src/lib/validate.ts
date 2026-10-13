import { sanitizeImage, type ProjectImage } from "./image";
import { slugify } from "./settings-defaults";
import type { ItemKind } from "./types";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bool = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);
const strList = (v: unknown, max = 30, len = 200) =>
  Array.isArray(v) ? v.map((x) => str(x, len)).filter(Boolean).slice(0, max) : [];

export class ValidationError extends Error {}

export function validateCategory(input: unknown) {
  const o = obj(input);
  const name = str(o.name, 80);
  if (!name) throw new ValidationError("Category name is required.");
  return {
    name,
    slug: slugify(str(o.slug, 80) || name),
    preset: /^(original|custom|\d+(\.\d+)?:\d+(\.\d+)?)$/.test(str(o.preset, 20)) ? str(o.preset, 20) : "16:9",
    visible: bool(o.visible, true),
  };
}

export function validateProject(input: unknown) {
  const o = obj(input);
  const title = str(o.title, 160);
  if (!title) throw new ValidationError("Project title is required.");
  const cover = sanitizeImage(o.cover);
  const gallery = Array.isArray(o.gallery)
    ? o.gallery.map((g) => sanitizeImage(g)).filter((g): g is ProjectImage => !!g).slice(0, 40)
    : [];
  const details = Array.isArray(o.details)
    ? o.details
        .map((d) => ({ label: str(obj(d).label, 60), value: str(obj(d).value, 300) }))
        .filter((d) => d.label && d.value)
        .slice(0, 12)
    : [];
  const categoryId = Number(o.categoryId);
  return {
    title,
    slug: slugify(str(o.slug, 80) || title),
    categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
    summary: str(o.summary, 400),
    description: str(o.description, 8000),
    details,
    tags: strList(o.tags, 15, 40),
    cover: cover ?? {},
    gallery,
    featured: bool(o.featured),
    published: bool(o.published, true),
    isDemo: bool(o.isDemo),
  };
}

export const ITEM_KINDS: ItemKind[] = ["service", "pricing", "faq", "testimonial"];

export function validateItem(kind: string, input: unknown) {
  if (!ITEM_KINDS.includes(kind as ItemKind)) throw new ValidationError("Unknown item type.");
  const o = obj(input);
  const d = obj(o.data);
  const visible = bool(o.visible, true);
  let data: Obj;
  switch (kind as ItemKind) {
    case "service":
      data = { title: str(d.title, 120), description: str(d.description, 600), icon: str(d.icon, 20) || "brand" };
      if (!data.title) throw new ValidationError("Service title is required.");
      break;
    case "pricing":
      data = {
        name: str(d.name, 60),
        price: str(d.price, 40),
        currency: d.currency === "USD" ? "USD" : "BDT",
        description: str(d.description, 400),
        deliverables: strList(d.deliverables, 20),
        revisions: str(d.revisions, 60),
        delivery: str(d.delivery, 60),
        addons: strList(d.addons, 12),
        ctaText: str(d.ctaText, 40) || "Get Started",
        featured: bool(d.featured),
      };
      if (!data.name) throw new ValidationError("Package name is required.");
      break;
    case "faq":
      data = { question: str(d.question, 300), answer: str(d.answer, 2000) };
      if (!data.question || !data.answer) throw new ValidationError("Question and answer are required.");
      break;
    case "testimonial":
      data = {
        name: str(d.name, 80),
        role: str(d.role, 120),
        quote: str(d.quote, 1000),
        avatarUrl: str(d.avatarUrl, 1000),
      };
      if (!data.name || !data.quote) throw new ValidationError("Name and quote are required.");
      break;
  }
  return { kind, data, visible };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(input: unknown) {
  const o = obj(input);
  const name = str(o.name, 120);
  const email = str(o.email, 200);
  const message = str(o.message || o.projectDetails, 5000);
  const packageName = str(o.packageName || o.package, 80);
  const service = str(o.service, 120);
  const budget = str(o.budget, 80);

  if (!name) throw new ValidationError("Please enter your name.");
  if (!EMAIL.test(email)) throw new ValidationError("Please enter a valid email address.");
  if (message.length < 10) throw new ValidationError("Please tell us a little more (at least 10 characters).");

  return {
    name,
    email,
    message,
    packageName: packageName || "Not specified",
    service: service || "Not specified",
    budget: budget || "Not specified",
  };
}

export function isEmail(v: string) {
  return EMAIL.test(v);
}