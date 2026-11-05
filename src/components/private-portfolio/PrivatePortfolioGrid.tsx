"use client";

import { useEffect, useState } from "react";
import type { ProjectImage } from "@/lib/image";
import type { SiteSettings } from "@/lib/settings-defaults";
import { ProjectImageView } from "@/components/site/ProjectImageView";
import { ArrowLeft, Close } from "@/components/site/icons";

export function PrivatePortfolioGrid({ images, layout }: { images: ProjectImage[]; layout: SiteSettings["portfolio"] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeImage = activeIndex === null ? null : images[activeIndex];
  const forceFit = layout.crop === "cover" || layout.crop === "contain" ? layout.crop : undefined;

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowRight") setActiveIndex((index) => index === null ? null : (index + 1) % images.length);
      if (event.key === "ArrowLeft") setActiveIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, images.length]);

  if (!images.length) return <p className="text-black/60">No images have been added to this page yet.</p>;

  return (
    <>
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
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="p-card group w-full cursor-zoom-in text-left"
            aria-label={`Open image ${index + 1}`}
          >
            <ProjectImageView
              image={image}
              forceAspect={layout.mode === "uniform" ? layout.aspect : undefined}
              frameHeight={layout.mode === "uniform" ? layout.frameHeight : undefined}
              forceFit={forceFit}
              radius={layout.radius}
              alt=""
            />
          </button>
        ))}
      </div>

      {activeImage && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Image ${activeIndex + 1} of ${images.length}`}
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] p-3 text-white shadow-2xl sm:rounded-3xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-white/60">{activeIndex + 1} / {images.length}</span>
              <button type="button" onClick={() => setActiveIndex(null)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 hover:bg-white/10" aria-label="Close preview">
                <Close size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <ProjectImageView image={activeImage} radius={12} eager alt="" className="mx-auto" />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex items-center justify-between gap-3">
                <button type="button" onClick={() => setActiveIndex((index) => index === null ? null : (index - 1 + images.length) % images.length)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                  <ArrowLeft size={16} /> Previous
                </button>
                <button type="button" onClick={() => setActiveIndex((index) => index === null ? null : (index + 1) % images.length)} className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
