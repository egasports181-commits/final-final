/* Client-safe site settings model, defaults, and sanitizer. */

export const FONT_OPTIONS = ["Poppins", "Space Grotesk", "Inter", "Manrope"] as const;
export type FontName = (typeof FONT_OPTIONS)[number];

export const SECTION_IDS = [
  "featured",
  "portfolio",
  "services",
  "pricing",
  "about",
  "process",
  "testimonials",
  "faq",
  "contact",
] as const;

export const SOCIAL_PLATFORMS = [
  "x",
  "instagram",
  "dribbble",
  "behance",
  "linkedin",
  "youtube",
  "facebook",
  "website",
] as const;

const device = (width: number, height: number, posY = 30) => ({
  width,
  height,
  scale: 1,
  posX: 50,
  posY,
  offsetX: 0,
  offsetY: 0,
});

export const DEFAULT_SETTINGS = {
  brand: {
    name: "Upflit",
    tagline: "Creative Design Studio",
    logoUrl: "",
    logoHeight: 34,
    faviconUrl: "",
  },
  hero: {
    introHeadline: "Unlock your brand's potential with bold design.",
    introText:
      "From logos and identities to thumbnails, posters and digital products — design that makes people stop and look.",
    primaryLabel: "View Work",
    primaryHref: "#work",
    secondaryLabel: "Start a project",
    secondaryHref: "#contact",
    headline1: "Creative",
    headline2: "Design",
    headline3: "Studio",
    sideText:
      "Upflit is an independent creative studio crafting brand identities, campaigns and visuals that help ambitious brands grow, scale, and stand out.",
    bgWord: "UPFLIT",
    imageUrl: "/images/hero.jpg",
    fit: "cover",
    layer: "behind",
    imageFade: true,
    desktop: device(44, 90, 25),
    tablet: device(64, 62, 25),
    mobile: device(100, 52, 20),
    paddingTop: 120,
    paddingBottom: 0,
    minHeight: 100,
    gradFrom: "#FF6A0A",
    gradVia: "#E93B01",
    gradTo: "#B51216",
    gradAngle: 150,
    showStats: true,
    stat1Value: "120+",
    stat1Label: "Design projects",
    stat2Title: "Start your brand's growth",
    stat2Value: "12",
    stat2Label: "Creative disciplines",
    showCard: true,
    cardTitle: "Your Partner in Creative Growth",
    cardText: "From first sketch to final file, we design with strategy, clarity and craft.",
    cardBadge: "Open for projects",
    stripTitle: "Tools we work with",
    stripItems: ["Figma", "Photoshop", "Illustrator", "After Effects", "Blender"],
    stripTags: ["Branding", "UI/UX", "Website Design", "Thumbnails", "Ads Campaign"],
  },
  sections: [
    { id: "featured", visible: true, eyebrow: "Selected", title: "Featured Work", subtitle: "A handpicked selection of recent creative work across brands, campaigns and digital." },
    { id: "portfolio", visible: true, eyebrow: "Portfolio", title: "All Projects", subtitle: "Filter by discipline to explore logos, identities, posters, thumbnails, UI and more." },
    { id: "services", visible: true, eyebrow: "Services", title: "What We Create", subtitle: "End-to-end creative services for brands that want to be remembered." },
    { id: "pricing", visible: true, eyebrow: "Pricing", title: "Simple Packages", subtitle: "Transparent starting points. Every project is tailored — reach out for a custom quote." },
    { id: "about", visible: true, eyebrow: "About", title: "Design With Purpose", subtitle: "" },
    { id: "process", visible: true, eyebrow: "Process", title: "How We Work", subtitle: "A clear, collaborative process from brief to final delivery." },
    { id: "testimonials", visible: true, eyebrow: "Kind Words", title: "Testimonials", subtitle: "" },
    { id: "faq", visible: true, eyebrow: "FAQ", title: "Questions & Answers", subtitle: "Everything you need to know before we start." },
    { id: "contact", visible: true, eyebrow: "Contact", title: "Let's Build Something Bold", subtitle: "Tell us about your project and we'll reply within 24–48 hours." },
  ],
  about: {
    text:
      "Upflit is a creative design studio focused on visual storytelling. We blend strategy with bold aesthetics to build brands, campaigns and digital experiences that feel distinctive and work hard. Every pixel has a purpose.",
    imageUrl: "/images/work-brand.jpg",
    highlights: [
      { value: "12", label: "Design disciplines" },
      { value: "48h", label: "Typical first draft" },
      { value: "100%", label: "Original work" },
    ],
  },
  process: [
    { title: "Discover", text: "We learn about your brand, audience and goals through a focused brief." },
    { title: "Concept", text: "We explore directions, moodboards and first concepts for your feedback." },
    { title: "Design", text: "The chosen direction is refined into polished, production-ready design." },
    { title: "Deliver", text: "Final files in every format you need, plus guidance for using them." },
  ],
  typography: {
    headingFont: "Poppins",
    bodyFont: "Poppins",
    displayFont: "Poppins",
    heroSize: 128,
    sectionSize: 76,
    bodySize: 16,
    headingWeight: 500,
    letterSpacing: -4,
  },
  colors: {
    primary: "#E93B01",
    bright: "#FF5A0A",
    deep: "#B51216",
    dark: "#080808",
    light: "#F7F4EF",
    muted: "#A7A7A7",
  },
  appearance: {
    radius: 24,
    buttonStyle: "pill",
    animations: true,
    animationSpeed: 1,
    cursor: "default",
    grain: true,
  },
  portfolio: {
    mode: "uniform",
    colsDesktop: 3,
    colsTablet: 2,
    colsMobile: 1,
    gap: 24,
    aspect: "4:3",
    frameHeight: 0,
    crop: "perImage",
    titlePosition: "below",
    hover: "zoom",
    radius: 20,
    featuredCount: 4,
    showFilters: true,
  },
  contact: {
    email: "hello@upflit.studio",
    phone: "+880 1700-000000",
    whatsapp: "",
    location: "Dhaka, Bangladesh · Working worldwide",
    availability: "Available for new projects",
    responseTime: "Replies within 24–48 hours",
  },
  social: [
    { platform: "x", url: "https://x.com" },
    { platform: "dribbble", url: "https://dribbble.com" },
    { platform: "instagram", url: "https://instagram.com" },
  ],
  nav: [
    { label: "Works", href: "#work" },
    { label: "Services", href: "#services" },
    { label: "Pricing", href: "#pricing" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ],
  footer: {
    ctaTitle: "Have a project in mind?",
    tagline: "Upflit — bold creative design for brands that want to stand out.",
    copyright: "© Upflit Studio. All rights reserved.",
  },
  seo: {
    title: "Upflit — Creative Design Studio",
    description:
      "Upflit is a creative design studio for logos, brand identity, posters, flyers, YouTube thumbnails, social media, UI/UX and website design.",
    keywords: "graphic design, branding, logo design, thumbnails, UI/UX, creative studio",
    ogImage: "",
  },
};

export type SiteSettings = typeof DEFAULT_SETTINGS;
export type SectionConfig = SiteSettings["sections"][number];
export type DeviceImage = SiteSettings["hero"]["desktop"];

const ENUMS: Record<string, readonly string[]> = {
  "hero.fit": ["cover", "contain"],
  "hero.layer": ["behind", "front", "blend"],
  "typography.headingFont": FONT_OPTIONS,
  "typography.bodyFont": FONT_OPTIONS,
  "typography.displayFont": FONT_OPTIONS,
  "appearance.buttonStyle": ["pill", "rounded", "square"],
  "appearance.cursor": ["default", "dot", "ring"],
  "portfolio.mode": ["uniform", "flexible"],
  "portfolio.crop": ["perImage", "cover", "contain"],
  "portfolio.titlePosition": ["below", "overlay", "hover"],
  "portfolio.hover": ["zoom", "lift", "tilt", "none"],
  "portfolio.aspect": ["16:9", "4:3", "3:2", "1:1", "4:5", "2:3", "1:1.414", "21:9"],
  "sections.id": SECTION_IDS,
  "social.platform": SOCIAL_PLATFORMS,
};

const LIMITS: Record<string, [number, number]> = {
  "brand.logoHeight": [18, 90],
  "hero.desktop.width": [20, 90],
  "hero.desktop.height": [30, 110],
  "hero.tablet.width": [30, 100],
  "hero.tablet.height": [25, 100],
  "hero.mobile.width": [40, 100],
  "hero.mobile.height": [25, 100],
  scale: [0.5, 2.5],
  posX: [0, 100],
  posY: [0, 100],
  offsetX: [-40, 40],
  offsetY: [-40, 40],
  "hero.paddingTop": [60, 260],
  "hero.paddingBottom": [0, 200],
  "hero.minHeight": [60, 130],
  "hero.gradAngle": [0, 360],
  "typography.heroSize": [56, 200],
  "typography.sectionSize": [36, 120],
  "typography.bodySize": [14, 20],
  "typography.headingWeight": [300, 800],
  "typography.letterSpacing": [-8, 4],
  "appearance.radius": [0, 40],
  "appearance.animationSpeed": [0.5, 2],
  "portfolio.colsDesktop": [1, 5],
  "portfolio.colsTablet": [1, 3],
  "portfolio.colsMobile": [1, 2],
  "portfolio.gap": [0, 64],
  "portfolio.frameHeight": [0, 700],
  "portfolio.radius": [0, 48],
  "portfolio.featuredCount": [1, 12],
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function sanitizeValue(def: unknown, input: unknown, path: string): unknown {
  const key = path.split(".").pop() || "";
  if (Array.isArray(def)) {
    if (!Array.isArray(input)) return def;
    const template = def[0];
    const arr = input.slice(0, 40).map((v) =>
      template === undefined ? v : sanitizeValue(template, v, path),
    );
    return arr;
  }
  if (def && typeof def === "object") {
    const src = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(def as Record<string, unknown>)) {
      out[k] = sanitizeValue(v, src[k], path ? `${path}.${k}` : k);
    }
    return out;
  }
  if (typeof def === "number") {
    const n = typeof input === "number" ? input : Number(input);
    if (input === undefined || input === null || input === "" || !Number.isFinite(n)) return def;
    const lim = LIMITS[path] || LIMITS[key];
    return lim ? Math.min(lim[1], Math.max(lim[0], n)) : n;
  }
  if (typeof def === "boolean") {
    return typeof input === "boolean" ? input : def;
  }
  if (typeof def === "string") {
    if (typeof input !== "string") return def;
    const enumPath = path.replace(/\.\d+/g, "");
    const options = ENUMS[enumPath];
    if (options) return options.includes(input) ? input : def;
    if (HEX.test(def)) return HEX.test(input) ? input : def;
    let v = input.slice(0, 3000);
    if (/^\s*javascript:/i.test(v)) v = "";
    return v;
  }
  return def;
}

export function sanitizeSettings(input: unknown): SiteSettings {
  const s = sanitizeValue(DEFAULT_SETTINGS, input, "") as SiteSettings;
  // Make sure every section exists exactly once, preserving saved order.
  const seen = new Set<string>();
  const sections = s.sections.filter((sec) => {
    if (seen.has(sec.id)) return false;
    seen.add(sec.id);
    return true;
  });
  for (const def of DEFAULT_SETTINGS.sections) {
    if (!seen.has(def.id)) sections.push({ ...def });
  }
  s.sections = sections;
  return s;
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

export function fontStack(name: string): string {
  const fallback = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif";
  return `'${name}', ${fallback}`;
}
