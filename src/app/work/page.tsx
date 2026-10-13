import type { Metadata } from "next";
import { getPublicData } from "@/lib/data";
import { SiteShell } from "@/components/site/SiteShell";
import { PortfolioGrid } from "@/components/site/client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Work" };

export default async function WorkPage() {
  const data = await getPublicData();
  const s = data.settings;
  const cfg = s.sections.find((x) => x.id === "portfolio");
  return (
    <SiteShell data={data}>
      <section className="brand-gradient grain relative overflow-hidden pb-16 pt-40 text-white">
        <div className="container-x relative z-10">
          <p className="eyebrow text-white/75 anim-rise">{cfg?.eyebrow || "Portfolio"}</p>
          <h1 className="t-hero mt-4 anim-rise" style={{ ["--d" as string]: ".1s" }}>{cfg?.title || "All Projects"}</h1>
          {cfg?.subtitle && <p className="t-lead mt-6 max-w-xl text-white/85 anim-rise" style={{ ["--d" as string]: ".2s" }}>{cfg.subtitle}</p>}
        </div>
      </section>
      <section className="section-y bg-[var(--c-light)] text-[#080808]">
        <div className="container-x">
          <PortfolioGrid projects={data.projects} categories={data.categories} layout={s.portfolio} tone="light" />
        </div>
      </section>
    </SiteShell>
  );
}
