"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, Project } from "@/lib/types";
import type { SiteSettings } from "@/lib/settings-defaults";
import { ProjectImageView } from "@/components/site/ProjectImageView";
import { ArrowLeft, Close } from "@/components/site/icons";

type Props = {
  projects: Project[];
  categories: Category[];
  layout: SiteSettings["portfolio"];
};

export function PrivatePortfolioGrid({ projects, categories, layout }: Props) {
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  const usedCategories = useMemo(
    () => categories.filter((category) => projects.some((project) => project.categoryId === category.id)),
    [categories, projects],
  );
  const visibleProjects =
    activeCategory === "all"
      ? projects
      : projects.filter((project) => project.categoryId === activeCategory);

  const categoryName = (id: number | null) =>
    categories.find((category) => category.id === id)?.name ?? "Creative Work";

  const activeImages = activeProject
    ? activeProject.gallery.length
      ? activeProject.gallery
      : activeProject.cover
        ? [activeProject.cover]
        : []
    : [];

  useEffect(() => {
    if (!activeProject) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveProject(null);
      if (event.key === "ArrowRight" && activeImages.length > 1) {
        setImageIndex((current) => (current + 1) % activeImages.length);
      }
      if (event.key === "ArrowLeft" && activeImages.length > 1) {
        setImageIndex((current) => (current - 1 + activeImages.length) % activeImages.length);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeProject, activeImages.length]);

  function openProject(project: Project) {
    setActiveProject(project);
    setImageIndex(0);
  }

  const uniform = layout.mode === "uniform";
  const forceFit = layout.crop === "cover" || layout.crop === "contain" ? layout.crop : undefined;

  return (
    <>
      <div>
        {usedCategories.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter portfolio by category">
            {[{ id: "all" as const, name: "All work" }, ...usedCategories].map((category) => {
              const selected = activeCategory === category.id;
              const count =
                category.id === "all"
                  ? projects.length
                  : projects.filter((project) => project.categoryId === category.id).length;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full border px-4 py-2 text-[0.78rem] tracking-wide transition ${
                    selected
                      ? "border-[var(--c-primary)] bg-[var(--c-primary)] text-white"
                      : "border-black/15 text-black/70 hover:border-black"
                  }`}
                >
                  {category.name}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {visibleProjects.length === 0 ? (
          <p className="text-black/60">No projects in this category yet.</p>
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
            {visibleProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => openProject(project)}
                className="p-card group page-in w-full cursor-pointer text-left"
                data-title={layout.titlePosition}
                aria-label={`Preview ${project.title} — ${categoryName(project.categoryId)}`}
              >
                <div className="relative">
                  <ProjectImageView
                    image={project.cover}
                    forceAspect={uniform ? layout.aspect : undefined}
                    frameHeight={uniform ? layout.frameHeight : undefined}
                    forceFit={forceFit}
                    radius={layout.radius}
                    alt={project.title}
                  />
                  {project.isDemo && (
                    <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.62rem] uppercase tracking-widest text-white backdrop-blur">
                      Concept
                    </span>
                  )}
                  {layout.titlePosition !== "below" && (
                    <div className="p-overlay text-white" style={{ borderRadius: layout.radius }}>
                      <span className="eyebrow text-white/70">{categoryName(project.categoryId)}</span>
                      <span className="t-title mt-1">{project.title}</span>
                    </div>
                  )}
                </div>
                {layout.titlePosition === "below" && (
                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="t-title truncate text-[#080808]">{project.title}</div>
                      <div className="t-caption mt-1 text-black/55">{categoryName(project.categoryId)}</div>
                    </div>
                    <span className="p-arrow grid h-10 w-10 shrink-0 place-items-center rounded-full border border-black/15 text-black">
                      <span className="text-lg leading-none">↗</span>
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Preview: ${activeProject.title}`}
          onClick={() => setActiveProject(null)}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] text-white shadow-2xl sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
              <div className="min-w-0">
                <p className="eyebrow text-white/55">{categoryName(activeProject.categoryId)}</p>
                <h2 className="t-title mt-1 truncate">{activeProject.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveProject(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 hover:bg-white/10"
                aria-label="Close preview"
              >
                <Close size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
              {activeImages.length > 0 ? (
                <div className="relative mx-auto max-w-5xl">
                  <ProjectImageView
                    image={activeImages[imageIndex]}
                    radius={12}
                    eager
                    alt={activeImages[imageIndex].alt || activeProject.title}
                    className="mx-auto"
                  />
                  {activeImages.length > 1 && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setImageIndex((current) => (current - 1 + activeImages.length) % activeImages.length)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        <ArrowLeft size={16} /> Previous
                      </button>
                      <span className="text-xs tabular-nums text-white/55">
                        {imageIndex + 1} / {activeImages.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setImageIndex((current) => (current + 1) % activeImages.length)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-16 text-center text-white/55">No preview image available.</p>
              )}
              {activeProject.summary && (
                <p className="mx-auto mt-5 max-w-5xl text-sm leading-relaxed text-white/65">
                  {activeProject.summary}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
