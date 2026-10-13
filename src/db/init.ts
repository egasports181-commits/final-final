import { pool, db } from "./index";
import { categories, projects, items, settings } from "./schema";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { newImage, type ProjectImage } from "@/lib/image";

const DDL = `
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  preset text NOT NULL DEFAULT '16:9',
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS projects (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id integer,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover jsonb NOT NULL DEFAULT '{}'::jsonb,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  kind text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS media (
  id serial PRIMARY KEY,
  filename text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL,
  data bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inquiries (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  package_name text NOT NULL DEFAULT '',
  service text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

const CATEGORY_SEED: [string, string][] = [
  ["Logo Design", "1:1"],
  ["Brand Identity", "4:3"],
  ["Flyer Design", "1:1.414"],
  ["Poster Design", "2:3"],
  ["YouTube Thumbnail", "16:9"],
  ["Social Media Design", "1:1"],
  ["Banner and Advertisement", "3:1"],
  ["UI/UX Design", "4:3"],
  ["Website Design", "16:9"],
  ["Packaging", "4:3"],
  ["Illustration", "4:5"],
  ["Other Creative Work", "4:3"],
];

function img(url: string, aspect: string, extra: Partial<ProjectImage["display"]> = {}): ProjectImage {
  const i = newImage(url, aspect);
  i.display = { ...i.display, fit: "cover", ...extra };
  return i;
}

async function seed() {
  const cats = await db
    .insert(categories)
    .values(
      CATEGORY_SEED.map(([name, preset], i) => ({
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
        preset,
        sortOrder: i,
      })),
    )
    .returning();
  const cat = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

  const demo = [
    {
      title: "Nova Identity System",
      category: "Brand Identity",
      cover: img("/images/work-brand.jpg", "4:3"),
      gallery: [img("/images/work-brand.jpg", "16:9"), img("/images/work-logo.jpg", "1:1")],
      summary: "A confident identity system for a fictional fintech startup.",
      tags: ["Identity", "Stationery", "Logo"],
      featured: true,
    },
    {
      title: "Signal Poster Series",
      category: "Poster Design",
      cover: img("/images/work-poster.jpg", "2:3"),
      gallery: [img("/images/work-poster.jpg", "2:3")],
      summary: "Swiss-inspired typographic posters with bold geometric rhythm.",
      tags: ["Typography", "Print"],
      featured: true,
    },
    {
      title: "Tech Reaction Thumbnail",
      category: "YouTube Thumbnail",
      cover: img("/images/work-thumbnail.jpg", "16:9"),
      gallery: [img("/images/work-thumbnail.jpg", "16:9")],
      summary: "High-contrast, click-worthy thumbnail concept for a tech channel.",
      tags: ["YouTube", "CTR"],
      featured: true,
    },
    {
      title: "Ember Social Campaign",
      category: "Social Media Design",
      cover: img("/images/work-social.jpg", "1:1"),
      gallery: [img("/images/work-social.jpg", "4:5"), img("/images/work-social.jpg", "1:1")],
      summary: "A cohesive social grid system for a lifestyle brand launch.",
      tags: ["Instagram", "Campaign"],
      featured: true,
    },
    {
      title: "Pulse Dashboard UI",
      category: "UI/UX Design",
      cover: img("/images/work-uiux.jpg", "4:3"),
      gallery: [img("/images/work-uiux.jpg", "16:9")],
      summary: "Dark-mode analytics dashboard and landing page exploration.",
      tags: ["UI", "Product", "Web"],
      featured: false,
    },
    {
      title: "Aura Packaging",
      category: "Packaging",
      cover: img("/images/work-packaging.jpg", "4:3"),
      gallery: [img("/images/work-packaging.jpg", "4:3")],
      summary: "Minimal premium packaging for a skincare line.",
      tags: ["Packaging", "Print"],
      featured: false,
    },
    {
      title: "Monogram Logo Exploration",
      category: "Logo Design",
      cover: img("/images/work-logo.jpg", "1:1"),
      gallery: [img("/images/work-logo.jpg", "1:1")],
      summary: "Geometric logo mark tested across colorways and sizes.",
      tags: ["Logo", "Mark"],
      featured: false,
    },
    {
      title: "Afterglow Ad Campaign",
      category: "Banner and Advertisement",
      cover: img("/images/hero.jpg", "4:3", { posY: 30 }),
      gallery: [img("/images/hero.jpg", "3:1", { posY: 30 }), img("/images/hero.jpg", "4:5", { posY: 30 })],
      summary: "Editorial campaign visuals with a single, striking color story.",
      tags: ["Campaign", "Art Direction"],
      featured: false,
    },
  ];

  await db.insert(projects).values(
    demo.map((p, i) => ({
      title: p.title,
      slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryId: cat(p.category),
      summary: p.summary,
      description:
        `${p.summary}\n\nThis is a demo concept project included with Upflit so you can see how the portfolio looks. Replace it with your own work from the Admin Panel → Portfolio Projects.`,
      details: [
        { label: "Type", value: "Concept / Demo" },
        { label: "Discipline", value: p.category },
        { label: "Year", value: "2026" },
      ],
      tags: p.tags,
      cover: p.cover,
      gallery: p.gallery,
      featured: p.featured,
      published: true,
      isDemo: true,
      sortOrder: i,
    })),
  );

  const services = [
    ["Logo & Brand Identity", "Distinctive logos, color systems, typography and brand guidelines.", "brand"],
    ["Print & Poster Design", "Flyers, posters, brochures and print collateral that grab attention.", "print"],
    ["YouTube Thumbnails", "High-CTR thumbnails designed to stand out in a crowded feed.", "play"],
    ["Social Media Design", "Post templates, campaign visuals and cohesive social grids.", "social"],
    ["UI/UX & Web Design", "Clean interfaces and landing pages designed for clarity and conversion.", "ui"],
    ["Packaging & Ads", "Packaging, banners and advertising visuals that sell.", "box"],
  ];
  const pricing = [
    {
      name: "Starter",
      price: "4,999",
      currency: "BDT",
      description: "For quick, focused design needs.",
      deliverables: ["1 design deliverable", "2 initial concepts", "High-resolution files"],
      revisions: "2 revisions",
      delivery: "2–3 days",
      addons: ["Source file +BDT 1,000"],
      ctaText: "Choose Starter",
      featured: false,
    },
    {
      name: "Professional",
      price: "14,999",
      currency: "BDT",
      description: "For brands that need a complete visual set.",
      deliverables: ["Up to 5 deliverables", "3 initial concepts", "Source files included", "Social media kit"],
      revisions: "5 revisions",
      delivery: "5–7 days",
      addons: ["Brand guideline PDF", "Express delivery"],
      ctaText: "Choose Professional",
      featured: true,
    },
    {
      name: "Custom",
      price: "Let's talk",
      currency: "USD",
      description: "Full identities, campaigns or ongoing design support.",
      deliverables: ["Tailored scope", "Dedicated designer", "Priority support"],
      revisions: "Flexible",
      delivery: "Based on scope",
      addons: [],
      ctaText: "Request a Quote",
      featured: false,
    },
  ];
  const faqs = [
    ["How does a project start?", "Send an inquiry with your goals and timeline. We reply with questions, a scope and a quote before any work starts."],
    ["What files will I receive?", "You receive high-resolution exports (PNG, JPG, PDF) and, where included, editable source files (AI, PSD, Figma)."],
    ["How many revisions are included?", "Each package lists its revision allowance. Additional revisions can be added at any time."],
    ["Do you work with international clients?", "Yes. We work remotely with clients worldwide and accept payment in BDT or USD."],
  ];
  const testimonials = [
    ["Your Client Name", "Sample testimonial — replace in Admin", "Working with Upflit felt effortless. The designs were bold, on-brand and delivered on time."],
    ["Another Client", "Sample testimonial — replace in Admin", "Our new thumbnails and social visuals finally look like a real brand. Highly recommended."],
  ];

  await db.insert(items).values([
    ...services.map(([title, description, icon], i) => ({
      kind: "service",
      data: { title, description, icon },
      sortOrder: i,
    })),
    ...pricing.map((p, i) => ({ kind: "pricing", data: p, sortOrder: i })),
    ...faqs.map(([question, answer], i) => ({ kind: "faq", data: { question, answer }, sortOrder: i })),
    ...testimonials.map(([name, role, quote], i) => ({
      kind: "testimonial",
      data: { name, role, quote, avatarUrl: "" },
      sortOrder: i,
    })),
  ]);

  await db
    .insert(settings)
    .values({ key: "site", value: DEFAULT_SETTINGS })
    .onConflictDoNothing();
}

const g = globalThis as typeof globalThis & { __upflitInit?: Promise<void> };

/** Creates tables (idempotent) and seeds demo content exactly once. */
export function ensureDb(): Promise<void> {
  if (!g.__upflitInit) {
    g.__upflitInit = (async () => {
      await pool.query(DDL);
      const client = await pool.connect();
      try {
        await client.query("SELECT pg_advisory_lock(424242)");
        const seeded = await client.query("SELECT 1 FROM settings WHERE key = '__seeded'");
        if (seeded.rowCount === 0) {
          await seed();
          await client.query(
            "INSERT INTO settings (key, value) VALUES ('__seeded', 'true'::jsonb) ON CONFLICT DO NOTHING",
          );
        }
      } finally {
        await client.query("SELECT pg_advisory_unlock(424242)").catch(() => {});
        client.release();
      }
    })().catch((err) => {
      g.__upflitInit = undefined;
      throw err;
    });
  }
  return g.__upflitInit;
}
