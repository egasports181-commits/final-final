import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrivatePortfolioBySlug, getPublicData } from "@/lib/data";
import { SiteShell, inquiryOptions } from "@/components/site/SiteShell";
import { ContactSection } from "@/components/site/Sections";
import { PrivatePortfolioGrid } from "@/components/private-portfolio/PrivatePortfolioGrid";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await getPrivatePortfolioBySlug(slug);
  if (!portfolio) return { title: "Portfolio not found", robots: { index: false, follow: false } };
  return {
    title: portfolio.title || "Selected Work",
    description: portfolio.description || "A selected collection of creative work by Upflit.",
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
    openGraph: {
      title: portfolio.title || "Selected Work",
      description: portfolio.description || "A selected collection of creative work by Upflit.",
      images: portfolio.images[0]?.url ? [portfolio.images[0].url] : [],
    },
  };
}

export default async function PrivatePortfolioPage({ params }: Props) {
  const { slug } = await params;
  const [portfolio, data] = await Promise.all([getPrivatePortfolioBySlug(slug), getPublicData()]);
  if (!portfolio) notFound();

  const { packages, services } = inquiryOptions(data);
  const contactCfg =
    data.settings.sections.find((section) => section.id === "contact") ??
    { id: "contact", visible: true, eyebrow: "Contact", title: "Let's talk", subtitle: "" };
  const pageSettings = {
    ...data.settings,
    nav: [{ label: "Contact", href: "#contact" }],
  };

  return (
    <SiteShell data={{ ...data, settings: pageSettings }}>
      <section className="brand-gradient grain relative overflow-hidden pb-16 pt-36 text-white md:pt-44">
        <div className="container-x relative z-10">
          <div className="eyebrow mb-5 text-white/75">UPFLIT / PRIVATE PORTFOLIO</div>
          <h1 className="t-hero max-w-5xl anim-rise" style={{ fontSize: "clamp(2.8rem, 8vw, 7rem)" }}>
            {portfolio.title || "Selected Work"}
          </h1>
          {portfolio.description && (
            <p className="t-lead mt-6 max-w-2xl text-white/85 anim-rise" style={{ ["--d" as string]: ".12s" }}>
              {portfolio.description}
            </p>
          )}
        </div>
      </section>

      <section id="portfolio" className="section-y bg-[var(--c-light)] text-[#080808]">
        <div className="container-x">
          <PrivatePortfolioGrid images={portfolio.images} layout={pageSettings.portfolio} />
        </div>
      </section>

      <ContactSection
        cfg={contactCfg}
        index={2}
        s={pageSettings}
        packages={packages}
        services={services}
      />
    </SiteShell>
  );
}
