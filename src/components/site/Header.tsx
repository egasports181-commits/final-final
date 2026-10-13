"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/settings-defaults";
import { Logo } from "./Logo";
import { ArrowUpRight, Close, Grid, SocialIcon } from "./icons";

type Props = {
  settings: Pick<SiteSettings, "brand" | "nav" | "social" | "contact">;
  preview?: boolean;
};

export function Header({ settings, preview }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  useEffect(() => {
    if (preview) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [preview]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const href = (h: string) => (h.startsWith("#") && !onHome && !preview ? `/${h}` : h);
  const { brand, nav, social } = settings;

  return (
    <>
      <header
        className={`site-header ${preview ? "absolute" : "fixed"} inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "header-scrolled" : ""
        }`}
      >
        <div className={`container-x flex items-center justify-between gap-4 transition-all duration-500 ${scrolled ? "py-3" : "py-5 md:py-7"}`}>
          <div className="flex items-center gap-5">
            <Link href={preview ? "#" : "/"} aria-label={`${brand.name} home`} className="shrink-0">
              <Logo name={brand.name} logoUrl={brand.logoUrl} height={brand.logoHeight} variant="light" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group hidden sm:flex flex-col gap-[6px] p-2"
              aria-label="Open menu"
            >
              <span className="block h-[1.5px] w-8 bg-white transition-all group-hover:w-6" />
              <span className="block h-[1.5px] w-8 bg-white" />
            </button>
          </div>

          <nav className="nav-desktop items-center gap-7 text-white" aria-label="Primary">
            {nav.map((item, i) => (
              <a key={i} href={href(item.href)} className="nav-link">
                <sup>{String(i + 1).padStart(2, "0")}/</sup>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5 text-white">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/15"
              aria-label="Open menu"
            >
              <Grid size={18} />
            </button>
            <div className="nav-social items-center gap-2">
              {social.slice(0, 4).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.platform}
                  className={`grid h-9 w-9 place-items-center rounded-full border transition hover:scale-110 ${
                    i === 0 ? "border-white bg-white text-[#080808]" : "border-white/40 bg-white/10 text-white"
                  }`}
                >
                  <SocialIcon platform={s.platform} size={14} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>

      {open && (
        <div className="brand-gradient grain fixed inset-0 z-[60] flex flex-col overflow-y-auto page-in" role="dialog" aria-modal="true">
          <div className="container-x flex items-center justify-between py-6">
            <Logo name={brand.name} logoUrl={brand.logoUrl} height={brand.logoHeight} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#080808] transition hover:rotate-90"
              aria-label="Close menu"
            >
              <Close size={20} />
            </button>
          </div>
          <nav className="container-x flex flex-1 flex-col justify-center gap-1 py-8" aria-label="Menu">
            {nav.map((item, i) => (
              <a
                key={i}
                href={href(item.href)}
                onClick={() => setOpen(false)}
                className="group flex items-baseline gap-4 border-b border-white/20 py-3 text-white anim-rise"
                style={{ ["--d" as string]: `${0.05 * i}s` }}
              >
                <span className="text-xs opacity-70">{String(i + 1).padStart(2, "0")}/</span>
                <span className="t-section transition-transform duration-500 group-hover:translate-x-3">{item.label}</span>
                <ArrowUpRight className="ml-auto opacity-0 transition group-hover:opacity-100" size={32} />
              </a>
            ))}
          </nav>
          <div className="container-x flex flex-wrap items-center justify-between gap-4 pb-8 text-sm text-white/85">
            <a href={`mailto:${settings.contact.email}`} className="underline-offset-4 hover:underline">
              {settings.contact.email}
            </a>
            <div className="flex gap-2">
              {social.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" aria-label={s.platform} className="grid h-10 w-10 place-items-center rounded-full border border-white/40 hover:bg-white hover:text-[#080808]">
                  <SocialIcon platform={s.platform} />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
