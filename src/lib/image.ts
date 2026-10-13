import type { CSSProperties } from "react";

export type ImageFit = "cover" | "contain" | "fill";

export type ImageDisplay = {
  aspect: string; // "16:9", "4:5", "original", "custom" ...
  customW: number;
  customH: number;
  fit: ImageFit;
  scale: number; // zoom
  posX: number; // focal point 0..100
  posY: number;
  width: number; // % of frame width (40..100)
  height: number; // fixed px height, 0 = from aspect ratio
  radius: number; // -1 = inherit from layout
  bg: string; // background behind contained images
};

export type ProjectImage = {
  id: string;
  url: string;
  alt: string;
  naturalW?: number;
  naturalH?: number;
  display: ImageDisplay;
};

export const ASPECT_PRESETS: { value: string; label: string; hint: string }[] = [
  { value: "16:9", label: "16:9", hint: "YouTube thumbnail / landscape" },
  { value: "4:3", label: "4:3", hint: "Landscape" },
  { value: "3:2", label: "3:2", hint: "Landscape flyer / photo" },
  { value: "21:9", label: "21:9", hint: "Wide banner" },
  { value: "3:1", label: "3:1", hint: "Web / ad banner" },
  { value: "1:1", label: "1:1", hint: "Logo / social square" },
  { value: "4:5", label: "4:5", hint: "Social portrait" },
  { value: "2:3", label: "2:3", hint: "Poster portrait" },
  { value: "1:1.414", label: "A-series", hint: "A4 / A3 flyer & poster" },
  { value: "9:16", label: "9:16", hint: "Story / reel" },
  { value: "original", label: "Original", hint: "Keep image proportions" },
  { value: "custom", label: "Custom", hint: "Set your own ratio" },
];

export const DEFAULT_DISPLAY: ImageDisplay = {
  aspect: "16:9",
  customW: 16,
  customH: 9,
  fit: "cover",
  scale: 1,
  posX: 50,
  posY: 50,
  width: 100,
  height: 0,
  radius: -1,
  bg: "#111111",
};

const clamp = (n: unknown, min: number, max: number, fallback: number) => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
};

export function sanitizeDisplay(input: unknown, aspectFallback = "16:9"): ImageDisplay {
  const d = (input && typeof input === "object" ? input : {}) as Partial<ImageDisplay>;
  const fit: ImageFit = d.fit === "contain" || d.fit === "fill" ? d.fit : "cover";
  return {
    aspect:
      typeof d.aspect === "string" && /^(original|custom|\d+(\.\d+)?:\d+(\.\d+)?)$/.test(d.aspect)
        ? d.aspect
        : aspectFallback,
    customW: clamp(d.customW, 1, 100, 16),
    customH: clamp(d.customH, 1, 100, 9),
    fit,
    scale: clamp(d.scale, 0.5, 3, 1),
    posX: clamp(d.posX, 0, 100, 50),
    posY: clamp(d.posY, 0, 100, 50),
    width: clamp(d.width, 40, 100, 100),
    height: clamp(d.height, 0, 1200, 0),
    radius: clamp(d.radius, -1, 64, -1),
    bg: typeof d.bg === "string" && /^#[0-9a-fA-F]{3,8}$/.test(d.bg) ? d.bg : "#111111",
  };
}

export function sanitizeImage(input: unknown, aspectFallback?: string): ProjectImage | null {
  if (!input || typeof input !== "object") return null;
  const i = input as Partial<ProjectImage>;
  if (typeof i.url !== "string" || !i.url.trim()) return null;
  return {
    id: typeof i.id === "string" && i.id ? i.id.slice(0, 40) : Math.random().toString(36).slice(2, 10),
    url: i.url.trim().slice(0, 1000),
    alt: typeof i.alt === "string" ? i.alt.slice(0, 200) : "",
    naturalW: typeof i.naturalW === "number" ? i.naturalW : undefined,
    naturalH: typeof i.naturalH === "number" ? i.naturalH : undefined,
    display: sanitizeDisplay(i.display, aspectFallback),
  };
}

/** Returns CSS aspect-ratio value like "16 / 9". */
export function aspectRatioOf(aspect: string, d?: Partial<ImageDisplay>, natural?: { w?: number; h?: number }): string {
  if (aspect === "original") {
    if (natural?.w && natural?.h) return `${natural.w} / ${natural.h}`;
    return "4 / 3";
  }
  if (aspect === "custom") return `${d?.customW || 16} / ${d?.customH || 9}`;
  const [w, h] = aspect.split(":").map(Number);
  if (!w || !h) return "16 / 9";
  return `${w} / ${h}`;
}

export function frameStyle(
  img: ProjectImage,
  opts: { forceAspect?: string; defaultRadius?: number; ignoreHeight?: boolean } = {},
): CSSProperties {
  const d = img.display;
  const aspect = opts.forceAspect ?? d.aspect;
  const style: CSSProperties = {
    aspectRatio: aspectRatioOf(aspect, d, { w: img.naturalW, h: img.naturalH }),
    width: `${d.width}%`,
    marginInline: "auto",
    background: d.bg,
    borderRadius: d.radius >= 0 ? d.radius : opts.defaultRadius ?? undefined,
    overflow: "hidden",
    position: "relative",
  };
  if (d.height > 0 && !opts.ignoreHeight) {
    style.height = d.height;
    style.aspectRatio = "auto";
  }
  return style;
}

export function imgStyle(d: ImageDisplay): CSSProperties {
  return {
    width: "100%",
    height: "100%",
    objectFit: d.fit,
    objectPosition: `${d.posX}% ${d.posY}%`,
    transform: d.scale !== 1 ? `scale(${d.scale})` : undefined,
    transformOrigin: `${d.posX}% ${d.posY}%`,
    display: "block",
  };
}

export function newImage(url: string, aspect = "16:9", natural?: { w: number; h: number }): ProjectImage {
  return {
    id: Math.random().toString(36).slice(2, 10),
    url,
    alt: "",
    naturalW: natural?.w,
    naturalH: natural?.h,
    display: { ...DEFAULT_DISPLAY, aspect, fit: aspect === "1:1" ? "contain" : "cover" },
  };
}
