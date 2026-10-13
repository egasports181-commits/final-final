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

/** Renders an image using its stored, non-destructive display settings. */
export function ProjectImageView({ image, forceAspect, forceFit, frameHeight, radius, className = "", alt, eager }: Props) {
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
  const style = frameStyle(image, { forceAspect, defaultRadius: radius, ignoreHeight: !!forceAspect });
  if (frameHeight && frameHeight > 0) {
    style.height = frameHeight;
    style.aspectRatio = "auto";
  }
  if (forceAspect) style.width = "100%";
  const display = forceFit ? { ...image.display, fit: forceFit } : image.display;
  return (
    <div className={`p-frame ${className}`} style={style}>
      <img
        src={image.url}
        alt={alt ?? image.alt ?? ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        style={imgStyle(display)}
      />
    </div>
  );
}
