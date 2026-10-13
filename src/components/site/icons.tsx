import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 18, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const ArrowUpRight = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const ArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
);
export const Plus = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Check = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="m5 12 4.5 4.5L19 7" /></svg>
);
export const Close = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Mail = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const Phone = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
export const Pin = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const Grid = ({ size, ...p }: P) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    {[5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
  </svg>
);
export const Sparkle = ({ size, ...p }: P) => (
  <svg {...base(size, p)}><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /></svg>
);

const SERVICE_PATHS: Record<string, string> = {
  brand: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5",
  print: "M7 3h10v5H7zM5 8h14a2 2 0 0 1 2 2v6h-4v5H7v-5H3v-6a2 2 0 0 1 2-2Zm4 9h6",
  play: "M3 6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6Zm7 3 5 3-5 3V9Z",
  social: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
  ui: "M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm0 4h18M9 21V9",
  box: "M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8",
  pen: "M12 19l7-7 3 3-7 7-3-3ZM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5ZM2 2l7.6 7.6M11 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z",
};
export const SERVICE_ICONS = Object.keys(SERVICE_PATHS);
export const ServiceIcon = ({ name, size = 26, ...p }: P & { name: string }) => (
  <svg {...base(size, p)}><path d={SERVICE_PATHS[name] || SERVICE_PATHS.star} /></svg>
);

export const SocialIcon = ({ platform, size = 15 }: { platform: string; size?: number }) => {
  const s = { width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true };
  switch (platform) {
    case "x":
      return <svg {...s}><path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.2l-4.9-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" /></svg>;
    case "instagram":
      return <svg {...s} fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>;
    case "dribbble":
      return <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3.5 9.5c6 .5 11-1 14.5-4.5M8 4c3.5 4.5 6 10 7 16.5M3.2 13.5c5-2 11-2 17.5.5" /></svg>;
    case "behance":
      return <svg {...s}><path d="M8.2 11.3c1-.5 1.6-1.3 1.6-2.5C9.8 6.5 8.1 6 6.2 6H1v12h5.4c2 0 4-1 4-3.4 0-1.5-.7-2.7-2.2-3.3ZM3.4 8h2.3c.9 0 1.7.2 1.7 1.2s-.6 1.3-1.5 1.3H3.4V8Zm2.5 8H3.4v-3.3H6c1 0 1.8.4 1.8 1.6 0 1.3-.9 1.7-1.9 1.7ZM15 7h5v1.2h-5V7Zm5.9 7.2c0-2.7-1.6-4.9-4.4-4.9-2.8 0-4.6 2.1-4.6 4.8 0 2.8 1.8 4.7 4.6 4.7 2.2 0 3.6-1 4.3-3.1h-2.2c-.3.8-1.2 1.2-2 1.2-1.5 0-2.3-.9-2.3-2.4H21l-.1-.3Zm-6.6-1.1c.1-1.2.9-2 2.1-2 1.3 0 1.9.8 2 2h-4.1Z" /></svg>;
    case "linkedin":
      return <svg {...s}><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.75Z" /></svg>;
    case "youtube":
      return <svg {...s}><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z" /></svg>;
    case "facebook":
      return <svg {...s}><path d="M14 8.5V6.6c0-.9.6-1.1 1-1.1h2.6V1.6L14 1.5c-4 0-4.9 3-4.9 4.9v2.1H6.8v4h2.3V22.5H14v-10h3.3l.5-4H14Z" /></svg>;
    default:
      return <svg {...s} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" /></svg>;
  }
};
