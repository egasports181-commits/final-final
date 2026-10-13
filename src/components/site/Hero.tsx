/* eslint-disable @next/next/no-img-element */
import type { SiteSettings } from "@/lib/settings-defaults";
import { heroVars } from "@/lib/theme";
import { LogoMark } from "./Logo";
import { ArrowUpRight, Sparkle } from "./icons";

type Props = { settings: SiteSettings; previewHeight?: number };

export function Hero({ settings, previewHeight }: Props) {
  const h = settings.hero;
  const lines = [h.headline1, h.headline2, h.headline3].filter(Boolean);
  return (
    <div className="hero-wrap" id="top">
      <section
        className="hero grain"
        data-layer={h.layer}
        style={heroVars(settings, previewHeight)}
        aria-label="Introduction"
      >
        <div className="container-x hero-inner">
          {/* Right: oversized headline */}
          <div className="h-head text-white">
            <h1 className="t-hero">
              {lines.map((l, i) => (
                <span key={i} className="line-mask">
                  <span className={i === 1 ? "fade-line" : ""} style={{ ["--d" as string]: `${0.1 + i * 0.12}s` }}>
                    {l}
                  </span>
                </span>
              ))}
            </h1>
            {h.sideText && (
              <p
                className="anim-rise mt-6 max-w-[22rem] text-[0.92rem] leading-relaxed text-white/90 md:ml-auto md:text-left"
                style={{ ["--d" as string]: ".45s" }}
              >
                {h.sideText}
              </p>
            )}
          </div>

          {/* Center visual */}
          <div className="h-visual" aria-hidden={!h.imageUrl}>
            {h.bgWord && <div className="h-word">{h.bgWord}</div>}
            {h.imageUrl && (
              <div className={`h-img ${h.imageFade ? "fade" : ""}`}>
                <img src={h.imageUrl} alt="" className="anim-img" fetchPriority="high" />
              </div>
            )}
          </div>

          {/* Left: intro */}
          <div className="h-intro text-white">
            <h2 className="h-intro-title anim-rise" style={{ ["--d" as string]: ".2s" }}>
              {h.introHeadline}
            </h2>
            {h.introText && (
              <p className="anim-rise mt-4 max-w-[24rem] text-[0.92rem] leading-relaxed text-white/85" style={{ ["--d" as string]: ".3s" }}>
                {h.introText}
              </p>
            )}
            <div className="anim-rise mt-7 flex flex-wrap gap-3" style={{ ["--d" as string]: ".4s" }}>
              {h.primaryLabel && (
                <a href={h.primaryHref || "#work"} className="btn btn-primary">
                  {h.primaryLabel}
                </a>
              )}
              {h.secondaryLabel && (
                <a href={h.secondaryHref || "#contact"} className="btn btn-ghost">
                  {h.secondaryLabel} <ArrowUpRight size={15} className="arrow" />
                </a>
              )}
            </div>
          </div>

          {h.showStats && (
            <div className="h-stats">
              <div
                className="anim-rise flex min-h-[10.5rem] flex-col justify-between bg-[#F4F1EC] p-5 text-[#2a0a05] shadow-[0_20px_50px_-20px_rgba(60,0,0,.5)]"
                style={{ borderRadius: "calc(var(--radius) * .75)", ["--d" as string]: ".5s" }}
              >
                <LogoMark size={26} variant="dark" />
                <div>
                  <div className="f-heading text-[clamp(2.2rem,4vw,3.3rem)] font-normal leading-none tracking-[-0.05em]">
                    {h.stat1Value}
                  </div>
                  <div className="mt-2 text-xs">{h.stat1Label}</div>
                </div>
              </div>
              <div
                className="glass anim-rise flex min-h-[10.5rem] flex-col justify-between p-5 text-white"
                style={{ borderRadius: "calc(var(--radius) * .75)", ["--d" as string]: ".6s" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[0.82rem] leading-snug">{h.stat2Title}</span>
                  <Sparkle size={18} className="spin-slow shrink-0" />
                </div>
                <div>
                  <div className="f-heading text-[clamp(2.2rem,4vw,3.3rem)] font-normal leading-none tracking-[-0.05em]">
                    {h.stat2Value}
                  </div>
                  <div className="mt-2 text-xs text-white/85">{h.stat2Label}</div>
                </div>
              </div>
            </div>
          )}

          {h.showCard && (
            <div className="h-card">
              <div className="glass floaty p-5 text-white" style={{ background: "linear-gradient(135deg, rgba(180,30,10,.35), rgba(255,255,255,.08))" }}>
                <div className="flex items-start justify-between gap-4">
                  <h3 className="f-heading text-[1.3rem] font-normal leading-tight tracking-tight">{h.cardTitle}</h3>
                  <a
                    href="#contact"
                    aria-label="Contact"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#080808] text-white ring-4 ring-white/15 transition hover:rotate-45"
                  >
                    <ArrowUpRight size={15} />
                  </a>
                </div>
                <p className="mt-8 text-xs leading-relaxed text-white/85">/ {h.cardText} /</p>
                {h.cardBadge && (
                  <div className="mt-4 flex justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#7a0c0c]/80 py-1.5 pl-1.5 pr-3 text-[0.7rem]">
                      <span className="flex -space-x-2">
                        {["#FF5A0A", "#F7F4EF", "#B51216"].map((c) => (
                          <span key={c} className="h-6 w-6 rounded-full border-2 border-[#7a0c0c]" style={{ background: c }} />
                        ))}
                      </span>
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
                      </span>
                      {h.cardBadge}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
