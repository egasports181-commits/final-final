import type { CSSProperties } from "react";
import { fontStack, type SiteSettings } from "./settings-defaults";

export function themeCss(s: SiteSettings): string {
  const c = s.colors;
  const t = s.typography;
  const a = s.appearance;
  const h = s.hero;
  const btnRadius = a.buttonStyle === "pill" ? "999px" : a.buttonStyle === "rounded" ? "14px" : "2px";
  return `:root{
--c-primary:${c.primary};--c-bright:${c.bright};--c-deep:${c.deep};--c-dark:${c.dark};--c-light:${c.light};--c-muted:${c.muted};
--f-heading:${fontStack(t.headingFont)};--f-body:${fontStack(t.bodyFont)};--f-display:${fontStack(t.displayFont)};
--fs-hero:${t.heroSize}px;--fs-section:${t.sectionSize}px;--fs-body:${t.bodySize}px;--fw-heading:${t.headingWeight};--ls-heading:${t.letterSpacing / 100}em;
--radius:${a.radius}px;--btn-radius:${btnRadius};--speed:${1 / a.animationSpeed};
--grad:linear-gradient(${h.gradAngle}deg, ${h.gradFrom}, ${h.gradVia} 50%, ${h.gradTo});
}`;
}

/** CSS variables for the hero. previewHeight (px) replaces vh-based heights in admin previews. */
export function heroVars(s: SiteSettings, previewHeight?: number): CSSProperties {
  const h = s.hero;
  const vars: Record<string, string> = {
    "--hero-grad": `linear-gradient(${h.gradAngle}deg, ${h.gradFrom}, ${h.gradVia} 50%, ${h.gradTo})`,
    "--hero-minh": previewHeight ? `${(previewHeight * h.minHeight) / 100}px` : `${h.minHeight}vh`,
    "--hero-pt": `${h.paddingTop}px`,
    "--hero-pb": `${h.paddingBottom}px`,
    "--hi-fit": h.fit,
  };
  const devices = { d: h.desktop, t: h.tablet, m: h.mobile } as const;
  for (const [k, d] of Object.entries(devices)) {
    vars[`--hi-w-${k}`] = `${d.width}%`;
    vars[`--hi-s-${k}`] = String(d.scale);
    vars[`--hi-px-${k}`] = `${d.posX}%`;
    vars[`--hi-py-${k}`] = `${d.posY}%`;
    vars[`--hi-ox-${k}`] = `${d.offsetX}%`;
    vars[`--hi-oy-${k}`] = `${d.offsetY}%`;
  }
  vars["--hi-h-d"] = `${h.desktop.height}%`;
  // Stacked layouts: height relative to container width (cqw) so previews match exactly.
  vars["--hi-h-t"] = `${(h.tablet.height / 100) * 110}cqw`;
  vars["--hi-h-m"] = `${(h.mobile.height / 100) * 150}cqw`;
  return vars as CSSProperties;
}
