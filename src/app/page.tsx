import { getPublicData } from "@/lib/data";
import { Hero } from "@/components/site/Hero";
import { SiteShell, inquiryOptions } from "@/components/site/SiteShell";
import {
  AboutSection,
  ContactSection,
  FaqSection,
  FeaturedSection,
  HeroStrip,
  PortfolioSection,
  PricingSection,
  ProcessSection,
  ServicesSection,
  TestimonialsSection,
} from "@/components/site/Sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPublicData();
  const s = data.settings;
  const { packages, services } = inquiryOptions(data);
  const byKind = (k: string) => data.items.filter((i) => i.kind === k);
  const visible = s.sections.filter((sec) => sec.visible);

  return (
    <SiteShell data={data}>
      <Hero settings={s} />
      <HeroStrip s={s} />
      {visible.map((cfg, i) => {
        const index = i + 1;
        switch (cfg.id) {
          case "featured":
            return <FeaturedSection key={cfg.id} cfg={cfg} index={index} s={s} projects={data.projects} categories={data.categories} />;
          case "portfolio":
            return <PortfolioSection key={cfg.id} cfg={cfg} index={index} s={s} projects={data.projects} categories={data.categories} />;
          case "services":
            return <ServicesSection key={cfg.id} cfg={cfg} index={index} items={byKind("service")} />;
          case "pricing":
            return <PricingSection key={cfg.id} cfg={cfg} index={index} items={byKind("pricing")} />;
          case "about":
            return <AboutSection key={cfg.id} cfg={cfg} index={index} s={s} />;
          case "process":
            return <ProcessSection key={cfg.id} cfg={cfg} index={index} s={s} />;
          case "testimonials":
            return <TestimonialsSection key={cfg.id} cfg={cfg} index={index} items={byKind("testimonial")} />;
          case "faq":
            return <FaqSection key={cfg.id} cfg={cfg} index={index} items={byKind("faq")} />;
          case "contact":
            return <ContactSection key={cfg.id} cfg={cfg} index={index} s={s} packages={packages} services={services} />;
          default:
            return null;
        }
      })}
    </SiteShell>
  );
}
