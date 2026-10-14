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

  // ইমেজের নিজস্ব আসল অ্যাসপেক্ট বা ডিসপ্লে সেটিংস ব্যবহার করবে
  const style = frameStyle(image, { forceAspect, defaultRadius: radius, ignoreHeight: !!forceAspect });

  if (frameHeight && frameHeight > 0) {
    style.height = frameHeight;
    style.aspectRatio = "auto";
  }

  if (forceAspect) style.width = "100%";

  // contain এর বদলে cover জোরপূর্বক নিশ্চিত করা যেন কালো বার না আসে
  const display = {
    ...image.display,
    fit: forceFit || (image.display.fit === "contain" ? "cover" : image.display.fit),
  };

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