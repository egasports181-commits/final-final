import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug, getPublicData } from "@/lib/data";
import { SiteShell } from "@/components/site/SiteShell";
import { ProjectImageView } from "@/components/site/ProjectImageView";
import { ArrowLeft, ArrowUpRight } from "@/components/site/icons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const res = await getProjectBySlug(slug);
  if (!res) return { title: "Project not found" };
  return {
    title: res.project.title,
    description: res.project.summary,
    openGraph: { images: res.project.cover ? [res.project.cover.url] : [] },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [res, data] = await Promise.all([getProjectBySlug(slug), getPublicData()]);
  if (!res) notFound();
  const { project: p, categories, all } = res;
  const cat = categories.find((c) => c.id === p.categoryId);
  const idx = all.findIndex((x) => x.id === p.id);
  const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
  const radius = data.settings.portfolio.radius;
  const images = p.gallery.length ? p.gallery : p.cover ? [p.cover] : [];

  return (
    <SiteShell data={data}>
      <section className="brand-gradient grain relative overflow-hidden pb-16 pt-36 text-white md:pt-44">
        <div className="container-x relative z-10">
          <Link href="/#portfolio" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft size={16} /> Back to work
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">{cat?.name ?? "Creative Work"}</span>
                {p.isDemo && <span className="pill bg-black/25">Concept / demo project</span>}
              </div>
              <h1 className="t-hero mt-6 anim-rise" style={{ fontSize: "clamp(2.6rem, 7vw, 6.5rem)" }}>{p.title}</h1>
            </div>
            {p.summary && <p className="t-lead text-white/90 anim-rise" style={{ ["--d" as string]: ".15s" }}>{p.summary}</p>}
          </div>
        </div>
      </section>

      <section className="bg-[var(--c-dark)] py-14 text-white md:py-20">
        <div className="container-x">
          {p.cover && (
            <div className="anim-img mb-14">
              <ProjectImageView image={p.cover} radius={radius} eager alt={p.title} />
            </div>
          )}
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              {p.details.length > 0 && (
                <dl className="grid gap-4 border-t border-white/10 pt-6">
                  {p.details.map((d, i) => (
                    <div key={i} className="flex justify-between gap-4 border-b border-white/10 pb-4 text-sm">
                      <dt className="text-white/50">{d.label}</dt>
                      <dd className="text-right">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {p.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75">#{t}</span>
                  ))}
                </div>
              )}
              <a href="/#contact" className="btn btn-accent mt-8">
                Start a similar project <ArrowUpRight size={15} className="arrow" />
              </a>
            </aside>
            <div>
              {p.description && <div className="t-lead whitespace-pre-line text-white/80">{p.description}</div>}
              <div className="mt-12 grid gap-8">
                {images.map((img) => (
                  <div key={img.id} className="reveal">
                    <ProjectImageView image={img} radius={radius} alt={img.alt || p.title} />
                    {img.alt && <p className="t-caption mt-3 text-white/50">{img.alt}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {next && (
        <Link href={`/work/${next.slug}`} className="group block bg-[var(--c-light)] py-16 text-[#080808] md:py-24">
          <div className="container-x flex items-center justify-between gap-6">
            <div className="min-w-0">
              <p className="eyebrow text-black/50">Next project</p>
              <p className="t-section mt-3 truncate transition group-hover:text-[var(--c-primary)]">{next.title}</p>
            </div>
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#080808] text-white transition group-hover:rotate-45 group-hover:bg-[var(--c-primary)] md:h-24 md:w-24">
              <ArrowUpRight size={28} />
            </span>
          </div>
        </Link>
      )}
    </SiteShell>
  );
}
