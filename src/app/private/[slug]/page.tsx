import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicData } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { SiteShell, inquiryOptions } from "@/components/site/SiteShell";
import { ContactSection } from "@/components/site/Sections";
import { PrivatePortfolioGrid } from "@/components/private-portfolio/PrivatePortfolioGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Portfolio | Upflit",
  description: "A private collection of selected creative work by Upflit.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function PrivatePortfolioPage({ params }: Props) {
  const { slug } = await params;
  const expectedSlug = process.env.UPFLIT_PRIVATE_PORTFOLIO_SLUG;

  // The unguessable URL is the access key. Never expose the expected slug
  // in client-side code or include it in the repository.
  if (!expectedSlug || slug !== expectedSlug) notFound();

  const data = await getPublicData();
  const { packages, services } = inquiryOptions(data);

  const portfolioCfg =
    data.settings.sections.find((section) => section.id === "portfolio") ??
    DEFAULT_SETTINGS.sections.find((section) => section.id === "portfolio")!;
  const contactCfg =
    data.settings.sections.find((section) => section.id === "contact") ??
    DEFAULT_SETTINGS.sections.find((section) => section.id === "contact")!;

  // Reuse the existing site shell, but only show navigation to the contact
  // section because the other homepage sections are not part of this page.
  const pageSettings = {
    ...data.settings,
    nav: [{ label: "Contact", href: "#contact" }],
    portfolio: { ...data.settings.portfolio, showFilters: true },
  };
  const pageData = { ...data, settings: pageSettings };

  return (
    <SiteShell data={pageData}>
      <section className="brand-gradient grain relative overflow-hidden pb-16 pt-36 text-white md:pt-44">
        <div className="container-x relative z-10">
          <div className="eyebrow mb-5 text-white/75">UPFLIT / PRIVATE PORTFOLIO</div>
          <h1 className="t-hero max-w-5xl anim-rise" style={{ fontSize: "clamp(2.8rem, 8vw, 7rem)" }}>
            A closer look at our work.
          </h1>
          <p className="t-lead mt-6 max-w-2xl text-white/85 anim-rise" style={{ ["--d" as string]: ".12s" }}>
            Explore selected creative work across thumbnails, logos, flyers and more.
          </p>
        </div>
      </section>

      <section id="portfolio" className="section-y bg-[var(--c-light)] text-[#080808]">
        <div className="container-x">
          <div className="reveal mb-12 grid gap-6 md:mb-16 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="eyebrow mb-4 flex items-center gap-3 text-black/55">
                <span className="text-[var(--c-primary)]">01/</span>
                {portfolioCfg.eyebrow}
              </div>
              <h2 className="t-section text-[#080808]">{portfolioCfg.title}</h2>
            </div>
            {portfolioCfg.subtitle && (
              <p className="t-lead max-w-md text-black/60 md:text-right">{portfolioCfg.subtitle}</p>
            )}
          </div>
          <div className="reveal">
            <PrivatePortfolioGrid
              projects={data.projects}
              categories={data.categories}
              layout={pageSettings.portfolio}
            />
          </div>
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
