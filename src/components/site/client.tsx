"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { SiteSettings } from "@/lib/settings-defaults";
import type { Category, Project } from "@/lib/types";
import { ProjectImageView } from "./ProjectImageView";
import { ArrowUpRight, Check, Close } from "./icons";

/* ---------------- Reveal on scroll ---------------- */
export function RevealObserver() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  });
  return null;
}

/* ---------------- Custom cursor ---------------- */
export function Cursor({ style }: { style: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (style === "default" || window.matchMedia("(hover: none)").matches) return;
    const el = ref.current;
    if (!el) return;
    let x = -100, y = -100, cx = -100, cy = -100, raf = 0;
    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      const t = e.target as HTMLElement;
      el.classList.toggle("is-hover", !!t.closest("a,button,[role=button],summary"));
    };
    const loop = () => {
      cx += (x - cx) * 0.22;
      cy += (y - cy) * 0.22;
      el.style.transform = `translate(${cx - el.offsetWidth / 2}px, ${cy - el.offsetHeight / 2}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, [style]);
  if (style === "default") return null;
  return <div ref={ref} className={`cursor-el ${style === "dot" ? "cursor-dot" : "cursor-ring"}`} aria-hidden />;
}

/* ---------------- Portfolio grid with filters ---------------- */
type GridProps = {
  projects: Project[];
  categories: Category[];
  layout: SiteSettings["portfolio"];
  tone?: "dark" | "light";
  showFilters?: boolean;
};

export function PortfolioGrid({ projects, categories, layout, tone = "light", showFilters = true }: GridProps) {
  const [active, setActive] = useState<number | "all">("all");
  const usedCats = useMemo(
    () => categories.filter((c) => projects.some((p) => p.categoryId === c.id)),
    [categories, projects],
  );
  const list = active === "all" ? projects : projects.filter((p) => p.categoryId === active);
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "Creative Work";
  const uniform = layout.mode === "uniform";
  const forceFit = layout.crop === "cover" || layout.crop === "contain" ? layout.crop : undefined;
  const dark = tone === "dark";

  return (
    <div>
      {showFilters && usedCats.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter projects by category">
          {[{ id: "all" as const, name: "All" }, ...usedCats].map((c) => {
            const on = active === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(c.id)}
                className={`rounded-full border px-4 py-2 text-[0.78rem] tracking-wide transition ${
                  on
                    ? "border-[var(--c-primary)] bg-[var(--c-primary)] text-white"
                    : dark
                      ? "border-white/20 text-white/80 hover:border-white"
                      : "border-black/15 text-black/70 hover:border-black"
                }`}
              >
                {c.name}
                {c.id !== "all" && (
                  <span className="ml-1.5 opacity-60">{projects.filter((p) => p.categoryId === c.id).length}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {list.length === 0 ? (
        <p className={dark ? "text-white/60" : "text-black/60"}>No projects in this category yet.</p>
      ) : (
        <div
          className="p-grid"
          data-mode={layout.mode}
          data-hover={layout.hover}
          style={
            {
              "--p-cols-d": layout.colsDesktop,
              "--p-cols-t": layout.colsTablet,
              "--p-cols-m": layout.colsMobile,
              "--p-gap": `${layout.gap}px`,
            } as React.CSSProperties
          }
        >
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/work/${p.slug}`}
              className="p-card group page-in"
              data-title={layout.titlePosition}
              aria-label={`${p.title} — ${catName(p.categoryId)}`}
            >
              <div className="relative">
                <ProjectImageView
                  image={p.cover}
                  forceAspect={uniform ? layout.aspect : undefined}
                  frameHeight={uniform ? layout.frameHeight : undefined}
                  forceFit={forceFit}
                  radius={layout.radius}
                  alt={p.title}
                />
                {p.isDemo && (
                  <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-white backdrop-blur">
                    Concept
                  </span>
                )}
                {layout.titlePosition !== "below" && (
                  <div className="p-overlay text-white" style={{ borderRadius: layout.radius }}>
                    <span className="eyebrow text-white/70">{catName(p.categoryId)}</span>
                    <span className="t-title mt-1">{p.title}</span>
                  </div>
                )}
              </div>
              {layout.titlePosition === "below" && (
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className={`t-title truncate ${dark ? "text-white" : "text-[#080808]"}`}>{p.title}</div>
                    <div className={`t-caption mt-1 ${dark ? "text-white/55" : "text-black/55"}`}>{catName(p.categoryId)}</div>
                  </div>
                  <span
                    className={`p-arrow grid h-10 w-10 shrink-0 place-items-center rounded-full border ${
                      dark ? "border-white/20 text-white" : "border-black/15 text-black"
                    }`}
                  >
                    <ArrowUpRight size={16} />
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Inquiry form ---------------- */
type FormProps = { packages: string[]; services: string[]; initialPackage?: string; compact?: boolean };

export function InquiryForm({ packages, services, initialPackage = "", compact }: FormProps) {
  const [pkg, setPkg] = useState(initialPackage);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => setPkg(initialPackage), [initialPackage]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setState("done");
      form.reset();
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-start gap-4 py-8 text-white" role="status">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[var(--c-primary)]">
          <Check size={26} />
        </span>
        <h3 className="t-title text-2xl">Thank you — message received!</h3>
        <p className="text-white/85">We&apos;ll review your project details and get back to you shortly.</p>
        <button type="button" className="btn btn-ghost mt-2" onClick={() => setState("idle")}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4 text-white" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className={`grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
        <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
          Name *
          <input name="name" required maxLength={120} className="field normal-case tracking-normal" placeholder="Your name" />
        </label>
        <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
          Email *
          <input name="email" type="email" required maxLength={200} className="field normal-case tracking-normal" placeholder="you@example.com" />
        </label>
      </div>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
          Package
          <select name="packageName" value={pkg} onChange={(e) => setPkg(e.target.value)} className="field normal-case tracking-normal">
            <option value="">Not sure yet</option>
            {packages.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
          Service
          <select name="service" defaultValue="" className="field normal-case tracking-normal">
            <option value="">Select a service</option>
            {services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        {!compact && (
          <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
            Budget
            <input name="budget" maxLength={80} className="field normal-case tracking-normal" placeholder="e.g. BDT 10,000" />
          </label>
        )}
      </div>
      <label className="grid gap-1.5 text-xs uppercase tracking-wider text-white/80">
        Project details *
        <textarea name="message" required rows={compact ? 4 : 5} maxLength={5000} className="field resize-y normal-case tracking-normal" placeholder="Tell us about your brand, goals and timeline…" />
      </label>
      {error && (
        <p className="rounded-xl bg-black/30 px-4 py-3 text-sm text-white" role="alert">
          {error}
        </p>
      )}
      <div>
        <button type="submit" className="btn btn-light" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send inquiry"} <ArrowUpRight size={15} className="arrow" />
        </button>
      </div>
    </form>
  );
}

/* ---------------- Inquiry modal (opened from pricing CTAs) ---------------- */
export function PackageButton({ name, label, featured }: { name: string; label: string; featured?: boolean }) {
  return (
    <button
      type="button"
      className={`btn w-full ${featured ? "btn-light" : "btn-accent"}`}
      onClick={() => window.dispatchEvent(new CustomEvent("upflit:inquire", { detail: name }))}
    >
      {label} <ArrowUpRight size={15} className="arrow" />
    </button>
  );
}

export function InquiryModal({ packages, services }: { packages: string[]; services: string[] }) {
  const [pkg, setPkg] = useState<string | null>(null);
  useEffect(() => {
    const open = (e: Event) => setPkg((e as CustomEvent<string>).detail || "");
    const key = (e: KeyboardEvent) => e.key === "Escape" && setPkg(null);
    window.addEventListener("upflit:inquire", open);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("upflit:inquire", open);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = pkg !== null ? "hidden" : "";
  }, [pkg]);
  if (pkg === null) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6 page-in" role="dialog" aria-modal="true" aria-label="Project inquiry" onClick={() => setPkg(null)}>
      <div
        className="brand-gradient grain relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[28px] p-6 sm:rounded-[28px] sm:p-9 anim-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={() => setPkg(null)} aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/25 text-white hover:bg-black/50">
          <Close size={18} />
        </button>
        <div className="relative z-10">
          <span className="eyebrow text-white/80">Project inquiry</span>
          <h3 className="t-section mt-2 text-white" style={{ fontSize: "clamp(1.8rem,5vw,2.6rem)" }}>
            {pkg ? `${pkg} package` : "Start a project"}
          </h3>
          <div className="mt-6">
            <InquiryForm packages={packages} services={services} initialPackage={pkg} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
