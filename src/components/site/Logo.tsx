/* eslint-disable @next/next/no-img-element */
type Props = {
  name?: string;
  logoUrl?: string;
  height?: number;
  variant?: "light" | "dark" | "brand";
  showText?: boolean;
  className?: string;
};

export function LogoMark({ size = 36, variant = "light" }: { size?: number; variant?: Props["variant"] }) {
  const circle = variant === "light" ? "#ffffff" : variant === "dark" ? "#080808" : "url(#upflit-g)";
  const stroke = variant === "light" ? "var(--c-primary)" : variant === "dark" ? "var(--c-bright)" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="upflit-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF5A0A" />
          <stop offset=".55" stopColor="#E93B01" />
          <stop offset="1" stopColor="#B51216" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={circle} />
      <path d="M19 38.5 32 25.5l13 13" fill="none" stroke={stroke} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 47.5 32 40.5l7 7" fill="none" stroke={stroke} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" opacity=".75" />
      <circle cx="44.5" cy="18.5" r="3.6" fill={stroke} />
    </svg>
  );
}

export function Logo({ name = "Upflit", logoUrl, height = 34, variant = "light", showText = true, className = "" }: Props) {
  if (logoUrl) {
    return <img src={logoUrl} alt={name} style={{ height, width: "auto" }} className={className} />;
  }
  const textColor = variant === "dark" || variant === "brand" ? "text-[#080808]" : "text-white";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label={name}>
      <LogoMark size={height} variant={variant} />
      {showText && (
        <span
          className={`f-heading font-semibold lowercase tracking-tight ${textColor}`}
          style={{ fontSize: Math.round(height * 0.62), letterSpacing: "-0.04em" }}
        >
          {name}
        </span>
      )}
    </span>
  );
}
