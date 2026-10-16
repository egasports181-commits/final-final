
/* eslint-disable @next/next/no-img-element */
import { frameStyle, imgStyle, type ProjectImage } from "@/lib/image";

type Props = {
  image: ProjectImage | null;
  forceAspect?: string;
  forceFit?: "cover" | "contain";
  frameHeight?: number;
  radius?: number;
  className?: string;
  alt?: string;
  eager?: boolean;
};

/**
 * Displays portfolio images with basic protection against casual copying.
 * This cannot prevent screenshots or extraction through browser developer tools.
 */
export function ProjectImageView({
  image,
  forceAspect,
  forceFit,
  frameHeight,
  radius,
  className = "",
  alt,
  eager,
}: Props) {
  if (!image) {
    return (
      <div
        className={`grid place-items-center bg-white/5 text-white/40 text-sm ${className}`}
        style={{ aspectRatio: "4 / 3", borderRadius: radius }}
      >
        No image
      </div>
    );
  }

  const style = frameStyle(image, {
    forceAspect,
    defaultRadius: radius,
    ignoreHeight: !!forceAspect,
  });

  if (frameHeight && frameHeight > 0) {
    style.height = frameHeight;
    style.aspectRatio = "auto";
  }

  if (forceAspect) {
    style.width = "100%";
  }

  const display = forceFit
    ? { ...image.display, fit: forceFit }
    : image.display;

  return (
    <div
      className={`p-frame relative overflow-hidden select-none ${className}`}
      style={style}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <img
        src={image.url}
        alt={alt ?? image.alt ?? ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        style={{
          ...imgStyle(display),
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 rounded-md border border-white/20 bg-black/35 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/65 backdrop-blur-[2px]"
      >
        UPFLIT · PORTFOLIO
      </span>
    </div>
  );
}
