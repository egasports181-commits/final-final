"use client";

import { useState } from "react";
import type { SectionConfig } from "@/lib/settings-defaults";
import type { Item, PricingData } from "@/lib/types";
import { Check } from "./icons";
import { PackageButton } from "./client";

type CategorizedPricingData = PricingData & { category?: string };
const DEFAULT_CATEGORY = "YouTube Thumbnail";

export function PricingSectionClient({ cfg, index, items }: { cfg: SectionConfig; index: number; items: Item[] }) {
  const pricingItems = items.filter((it) => it.kind === "pricing" && it.visible !== false);
  const getCategory = (it: Item) => {
    const data = it.data as unknown as CategorizedPricingData;
    return String(data.category ?? "").trim() || DEFAULT_CATEGORY;
  };
  const categories = Array.from(new Set(pricingItems.map(getCategory)));
  const [activeCategory, setActiveCategory] = useState(DEFAULT_CATEGORY);
  const safeActiveCategory = categories.includes(activeCategory) ? activeCategory : (categories[0] || DEFAULT_CATEGORY);
  const visibleItems = pricingItems.filter((it) => getCategory(it) === safeActiveCategory);

  if (!pricingItems.length) return null;

  return (
    <section id="pricing" className="section-y relative overflow-hidden bg-[var(--c-dark)] text-white">
      <div className="pointer-events-none absolute -right-40 top-20 h-[30rem] w-[30rem] rounded-full bg-[var(--c-primary)] opacity-25 blur-[120px]" />
      <div className="container-x relative">
        <div className="mb-12 grid gap-6 md:mb-16 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="eyebrow mb-4 flex items-center gap-3 text-white/70">
              <span>{String(index).padStart(2, "0")}/</span>
              {cfg.eyebrow}
            </div>
            <h2 className="t-section text-white">{cfg.title}</h2>
          </div>
          {cfg.subtitle && <div className="max-w-md md:text-right"><p className="t-lead text-white/75">{cfg.subtitle}</p></div>}
        </div>

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Pricing categories">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={safeActiveCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-5 py-3 text-sm transition-colors ${safeActiveCategory === category ? "border-[var(--c-primary)] bg-[var(--c-primary)] text-white" : "border-white/15 bg-white/5 text-white/70 hover:border-white/35 hover:text-white"}`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Keep the original pricing-card sizing and avoid reveal opacity hiding cards after tab changes. */}
        <div key={safeActiveCategory} className="mx-auto grid w-full max-w-6xl grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((it) => {
            const d = it.data as unknown as PricingData;
            const numeric = /\d/.test(d.price || "");
            return (
              <article
                key={it.id}
                className={`relative flex min-w-0 flex-col p-7 md:p-8 ${d.featured ? "brand-gradient grain shadow-[0_40px_80px_-30px_rgba(233,59,1,.6)] xl:-translate-y-4" : "glass-dark"}`}
                style={{ borderRadius: "var(--radius)" }}
              >
                <div className="relative z-10 flex flex-1 flex-col">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="f-heading text-xl font-medium">{d.name}</h3>
                    {d.featured && <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--c-primary)]">Popular</span>}
                  </div>
                  <p className={`mt-2 text-sm ${d.featured ? "text-white/90" : "text-white/60"}`}>{d.description}</p>
                  <div className="mt-7 flex flex-wrap items-baseline gap-2">
                    {numeric && <span className="text-sm opacity-70">{d.currency === "USD" ? "$" : "৳"}</span>}
                    <span className="t-price">{d.price || "—"}</span>
                    {numeric && <span className="text-xs opacity-60">{d.currency} · starting</span>}
                  </div>
                  <div className={`my-6 h-px ${d.featured ? "bg-white/30" : "bg-white/10"}`} />
                  <ul className="grid gap-3 text-sm">
                    {(Array.isArray(d.deliverables) ? d.deliverables : []).map((x, k) => (
                      <li key={k} className="flex gap-3">
                        <Check size={16} className={`mt-0.5 shrink-0 ${d.featured ? "" : "text-[var(--c-bright)]"}`} />
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-6 grid grid-cols-2 gap-3 text-xs">
                    <div className={`rounded-2xl p-3 ${d.featured ? "bg-black/15" : "bg-white/5"}`}>
                      <dt className="opacity-60">Revisions</dt>
                      <dd className="mt-1 font-medium">{d.revisions || "—"}</dd>
                    </div>
                    <div className={`rounded-2xl p-3 ${d.featured ? "bg-black/15" : "bg-white/5"}`}>
                      <dt className="opacity-60">Delivery</dt>
                      <dd className="mt-1 font-medium">{d.delivery || "—"}</dd>
                    </div>
                  </dl>
                  {Array.isArray(d.addons) && d.addons.length > 0 && (
                    <div className="mt-5">
                      <div className="eyebrow mb-2 opacity-60">Add-ons</div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.addons.map((a, k) => <span key={k} className="rounded-full border border-white/20 px-2.5 py-1 text-[0.7rem]">{a}</span>)}
                      </div>
                    </div>
                  )}
                  <div className="mt-auto pt-8">
                    <PackageButton name={d.name} label={d.ctaText || "Get started"} featured={d.featured} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-white/45">
          Prices are starting points. Final quotes depend on scope. No payment is taken on this website.
        </p>
      </div>
    </section>
  );
}
