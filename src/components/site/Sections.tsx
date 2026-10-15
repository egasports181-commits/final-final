/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import type { SectionConfig, SiteSettings } from "@/lib/settings-defaults";
import type { Category, FaqData, Item, PricingData, Project, ServiceData, TestimonialData } from "@/lib/types";
import { LogoMark, Logo } from "./Logo";
import { ArrowUpRight, Check, Mail, Phone, Pin, Plus, ServiceIcon, SocialIcon } from "./icons";
import { InquiryForm, PackageButton, PortfolioGrid } from "./client";
import { ProjectImageView } from "./ProjectImageView";
import { PricingSectionClient } from "./PricingSectionClient";

export function SectionHead({
  cfg,
  index,
  tone = "dark",
  aside,
}: {
  cfg: SectionConfig;
  index: number;
  tone?: "dark" | "light";
  aside?: ReactNode;
}) {
  const light = tone === "light";
  return (
    <div className="reveal mb-12 grid gap-6 md:mb-16 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <div className={`eyebrow mb-4 flex items-center gap-3 ${light ? "text-black/55" : "text-white/70"}`}>
          <span className={light ? "text-[var(--c-primary)]" : ""}>{String(index).padStart(2, "0")}/</span>
          {cfg.eyebrow}
        </div>
        <h2 className={`t-section ${light ? "text-[#080808]" : "text-white"}`}>{cfg.title}</h2>
      </div>
      {(cfg.subtitle || aside) && (
        <div className="max-w-md md:text-right">
          {cfg.subtitle && <p className={`t-lead ${light ? "text-black/60" : "text-white/75"}`}>{cfg.subtitle}</p>}
          {aside}
        </div>
      )}
    </div>
  );
}

/* ---------- Dark info strip under hero ---------- */
export function HeroStrip({ s }: { s: SiteSettings }) {
  const h = s.hero;
  const items = [...h.stripItems, ...h.stripItems];
  return (
    <section className="relative z-10 border-t border-white/5 bg-[var(--c-dark)] py-8 text-white md:py-10">
      <div className="container-x grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="eyebrow mb-4 text-white/70">{h.stripTitle}</div>
          <div className="marquee">
            {[0, 1].map((k) => (
              <div key={k} className="marquee-track" aria-hidden={k === 1}>
                {items.map((t, i) => (
                  <span key={i} className="f-heading flex items-center gap-2.5 text-xl font-semibold tracking-tight text-white/45">
                    <span className="h-2 w-2 rounded-full bg-[var(--c-primary)]" />
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:max-w-[38rem] lg:justify-end">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-white/35">
            <LogoMark size={20} variant="light" />
          </span>
          {h.stripTags.map((t, i) => (
            <span key={i} className="pill">{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Featured work ---------- */
export function FeaturedSection({ cfg, index, s, projects, categories }: { cfg: SectionConfig; index: number; s: SiteSettings; projects: Project[]; categories: Category[] }) {
  const list = projects.filter((p) => p.featured).slice(0, s.portfolio.featuredCount);
  if (!list.length) return null;
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "Creative Work";
  const spans = ["md:col-span-7", "md:col-span-5", "md:col-span-5", "md:col-span-7"];
  const aspects = ["7:5", "1:1", "1:1", "7:5"];
  return (
    <section id="work" className="section-y relative bg-[var(--c-dark)] text-white">
      <div className="container-x">
        <SectionHead
          cfg={cfg}
          index={index}
          aside={
            <a href="#portfolio" className="btn btn-ghost mt-6">
              All projects <ArrowUpRight size={15} className="arrow" />
            </a>
          }
        />
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-12" data-hover={s.portfolio.hover}>
          {list.map((p, i) => (
            <Link
              key={p.id}
              href={`/work/${p.slug}`}
              className={`p-card group reveal ${spans[i % 4]}`}
              style={{ ["--d" as string]: `${(i % 2) * 0.1}s` }}
            >
              <div className="relative">
                <ProjectImageView image={p.cover} forceAspect={aspects[i % 4]} radius={s.portfolio.radius} alt={p.title} />
                <span className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white text-black p-arrow">
                  <ArrowUpRight size={18} />
                </span>
                {p.isDemo && (
                  <span className="absolute left-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest backdrop-blur">
                    Concept
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-baseline gap-4">
                <span className="text-sm text-[var(--c-bright)]">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0">
                  <h3 className="t-title">{p.title}</h3>
                  <p className="t-caption mt-1 text-white/55">
                    {catName(p.categoryId)}
                    {p.tags.length ? ` · ${p.tags.slice(0, 2).join(" · ")}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- All projects ---------- */
export function PortfolioSection({ cfg, index, s, projects, categories }: { cfg: SectionConfig; index: number; s: SiteSettings; projects: Project[]; categories: Category[] }) {
  return (
    <section id="portfolio" className="section-y bg-[var(--c-light)] text-[#080808]">
      <div className="container-x">
        <SectionHead cfg={cfg} index={index} tone="light" />
        <div className="reveal">
          <PortfolioGrid projects={projects} categories={categories} layout={s.portfolio} showFilters={s.portfolio.showFilters} tone="light" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Services ---------- */
export function ServicesSection({ cfg, index, items }: { cfg: SectionConfig; index: number; items: Item[] }) {
  if (!items.length) return null;
  return (
    <section id="services" className="section-y brand-gradient grain relative overflow-hidden text-white">
      <div className="container-x relative z-10">
        <SectionHead cfg={cfg} index={index} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const d = it.data as unknown as ServiceData;
            return (
              <article
                key={it.id}
                className="glass reveal group flex min-h-[15rem] flex-col justify-between p-7 transition duration-500 hover:-translate-y-1 hover:bg-white hover:text-[#080808]"
                style={{ ["--d" as string]: `${(i % 3) * 0.08}s` }}
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 transition group-hover:bg-[var(--c-primary)] group-hover:text-white">
                    <ServiceIcon name={d.icon} />
                  </span>
                  <span className="text-sm opacity-60">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-10">
                  <h3 className="t-title text-[1.4rem]">{d.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed opacity-80">{d.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
export function PricingSection({ cfg, index, items }: { cfg: SectionConfig; index: number; items: Item[] }) {
  return <PricingSectionClient cfg={cfg} index={index} items={items} />;
}

/* ---------- About ---------- */
export function AboutSection({ cfg, index, s }: { cfg: SectionConfig; index: number; s: SiteSettings }) {
  const a = s.about;
  return (
    <section id="about" className="section-y overflow-hidden bg-[var(--c-light)] text-[#080808]">
      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="reveal relative">
          <div className="relative aspect-[4/5] overflow-hidden" style={{ borderRadius: "var(--radius)" }}>
            {a.imageUrl ? <img src={a.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="brand-gradient h-full w-full" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-deep)]/50 to-transparent mix-blend-multiply" />
          </div>
          <div className="glass floaty absolute -bottom-6 right-4 max-w-[15rem] bg-[var(--c-primary)]/80 p-5 text-white md:-right-6">
            <LogoMark size={28} />
            <p className="mt-3 text-sm leading-snug">{s.brand.tagline}</p>
          </div>
        </div>
        <div>
          <div className="reveal eyebrow mb-4 flex items-center gap-3 text-black/55">
            <span className="text-[var(--c-primary)]">{String(index).padStart(2, "0")}/</span>
            {cfg.eyebrow}
          </div>
          <h2 className="reveal t-section">{cfg.title}</h2>
          {cfg.subtitle && <p className="reveal t-lead mt-5 text-black/60">{cfg.subtitle}</p>}
          <p className="reveal t-lead mt-6 whitespace-pre-line text-black/70">{a.text}</p>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-black/10 pt-8">
            {a.highlights.map((h, i) => (
              <div key={i} className="reveal" style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <div className="f-heading text-[clamp(1.8rem,4vw,3rem)] font-medium leading-none tracking-[-0.05em] text-[var(--c-primary)]">{h.value}</div>
                <div className="mt-2 text-xs text-black/60 sm:text-sm">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Process ---------- */
export function ProcessSection({ cfg, index, s }: { cfg: SectionConfig; index: number; s: SiteSettings }) {
  if (!s.process.length) return null;
  return (
    <section id="process" className="section-y relative overflow-hidden bg-[var(--c-dark)] text-white">
      <div className="container-x">
        <SectionHead cfg={cfg} index={index} />
        <ol className="grid gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4" style={{ borderRadius: "var(--radius)" }}>
          {s.process.map((p, i) => (
            <li key={i} className="reveal group relative bg-[var(--c-dark)] p-7 transition-colors duration-500 hover:bg-[var(--c-primary)] md:p-9" style={{ ["--d" as string]: `${i * 0.08}s` }}>
              <span className="f-display block text-[4.5rem] font-medium leading-none tracking-[-0.06em] text-white/10 transition group-hover:text-white/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="t-title mt-8 text-[1.4rem]">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/65 group-hover:text-white/90">{p.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Testimonials ---------- */
export function TestimonialsSection({ cfg, index, items }: { cfg: SectionConfig; index: number; items: Item[] }) {
  if (!items.length) return null;
  return (
    <section id="testimonials" className="section-y brand-gradient grain relative overflow-hidden text-white">
      <div className="container-x relative z-10">
        <SectionHead cfg={cfg} index={index} />
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((it, i) => {
            const d = it.data as unknown as TestimonialData;
            return (
              <figure key={it.id} className="glass reveal flex flex-col justify-between p-7 md:p-9" style={{ ["--d" as string]: `${i * 0.08}s` }}>
                <blockquote className="f-heading text-[clamp(1.15rem,2vw,1.55rem)] font-light leading-snug">“{d.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  {d.avatarUrl ? (
                    <img src={d.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-sm font-semibold text-[var(--c-primary)]">
                      {d.name.slice(0, 1)}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-medium">{d.name}</span>
                    <span className="block text-xs text-white/75">{d.role}</span>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function FaqSection({ cfg, index, items }: { cfg: SectionConfig; index: number; items: Item[] }) {
  if (!items.length) return null;
  return (
    <section id="faq" className="section-y bg-[var(--c-light)] text-[#080808]">
      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <SectionHead cfg={{ ...cfg, subtitle: "" }} index={index} tone="light" />
          {cfg.subtitle && <p className="reveal t-lead -mt-6 max-w-md text-black/60">{cfg.subtitle}</p>}
        </div>
        <div className="divide-y divide-black/10 border-y border-black/10">
          {items.map((it, i) => {
            const d = it.data as unknown as FaqData;
            return (
              <details key={it.id} className="faq reveal group py-1" style={{ ["--d" as string]: `${i * 0.05}s` }}>
                <summary className="flex items-center justify-between gap-6 py-5">
                  <span className="t-title">{d.question}</span>
                  <span className="faq-icon grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/15 group-open:border-[var(--c-primary)] group-open:bg-[var(--c-primary)] group-open:text-white">
                    <Plus size={16} />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 pr-14 text-black/65">{d.answer}</p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------- Contact ---------- */
export function ContactSection({ cfg, index, s, packages, services }: { cfg: SectionConfig; index: number; s: SiteSettings; packages: string[]; services: string[] }) {
  const c = s.contact;
  return (
    <section id="contact" className="section-y brand-gradient grain relative overflow-hidden text-white">
      <div className="container-x relative z-10 grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <div className="reveal eyebrow mb-4 text-white/75">{String(index).padStart(2, "0")}/ {cfg.eyebrow}</div>
          <h2 className="reveal t-section">{cfg.title}</h2>
          {cfg.subtitle && <p className="reveal t-lead mt-5 max-w-md text-white/85">{cfg.subtitle}</p>}
          <ul className="reveal mt-10 grid gap-4 text-sm">
            {c.email && (
              <li><a href={`mailto:${c.email}`} className="flex items-center gap-3 hover:underline"><Mail /> {c.email}</a></li>
            )}
            {c.phone && (
              <li><a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-3 hover:underline"><Phone /> {c.phone}</a></li>
            )}
            {c.whatsapp && (
              <li><a href={`https://wa.me/${c.whatsapp.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:underline"><Phone /> WhatsApp</a></li>
            )}
            {c.location && <li className="flex items-center gap-3"><Pin /> {c.location}</li>}
          </ul>
          <div className="reveal mt-8 flex flex-wrap gap-2">
            {c.availability && (
              <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-4 py-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-green-400" /> {c.availability}
              </span>
            )}
            {c.responseTime && <span className="rounded-full border border-white/35 px-4 py-2 text-xs">{c.responseTime}</span>}
          </div>
        </div>
        <div className="glass reveal p-6 md:p-9" style={{ background: "linear-gradient(135deg, rgba(0,0,0,.18), rgba(255,255,255,.08))" }}>
          <InquiryForm packages={packages} services={services} />
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer({ s }: { s: SiteSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden bg-[var(--c-dark)] pt-20 text-white">
      <div className="container-x">
        <div className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="eyebrow text-white/50">{s.footer.ctaTitle}</p>
            <a href={`mailto:${s.contact.email}`} className="group mt-4 inline-flex items-center gap-3 break-all f-heading text-[clamp(1.6rem,4vw,3.2rem)] font-medium tracking-[-0.04em] hover:text-[var(--c-bright)]">
              {s.contact.email}
              <ArrowUpRight size={36} className="shrink-0 transition group-hover:rotate-45" />
            </a>
            <p className="mt-6 max-w-md text-sm text-white/55">{s.footer.tagline}</p>
          </div>
          <div>
            <p className="eyebrow mb-4 text-white/50">Menu</p>
            <ul className="grid gap-2 text-sm">
              {s.nav.map((n, i) => (
                <li key={i}><a href={n.href.startsWith("#") ? `/${n.href}` : n.href} className="text-white/80 hover:text-white">{n.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4 text-white/50">Follow</p>
            <div className="flex flex-wrap gap-2">
              {s.social.map((x, i) => (
                <a key={i} href={x.url} target="_blank" rel="noreferrer" aria-label={x.platform} className="grid h-11 w-11 place-items-center rounded-full border border-white/20 transition hover:border-[var(--c-primary)] hover:bg-[var(--c-primary)]">
                  <SocialIcon platform={x.platform} />
                </a>
              ))}
            </div>
            {s.contact.location && <p className="mt-6 text-sm text-white/55">{s.contact.location}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-white/45">
          <Logo name={s.brand.name} logoUrl={s.brand.logoUrl} height={26} variant="light" />
          <span>{s.footer.copyright.replace("©", `© ${year}`)}</span>
          <a href="#top" className="hover:text-white">Back to top ↑</a>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none select-none text-center f-display font-medium leading-[0.75] tracking-[-0.06em] text-white/[0.04]" style={{ fontSize: "24vw" }}>
        {s.hero.bgWord || s.brand.name}
      </div>
    </footer>
  );
}
