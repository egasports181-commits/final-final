import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "./globals.css";
import { getSettings } from "@/lib/data";
import { themeCss } from "@/lib/theme";
import { Analytics } from "@vercel/analytics/next";
import FloatingContact from "@/components/site/FloatingContact";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSettings();
  const seo = settings.seo;
  const favicon = settings.brand.faviconUrl || "/favicon.svg";
  return {
    metadataBase: new URL(process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000"),
    title: { default: seo.title, template: `%s — ${settings.brand.name}` },
    description: seo.description,
    keywords: seo.keywords,
    icons: {
      icon: [
        { url: favicon, type: favicon.endsWith(".svg") ? "image/svg+xml" : undefined },
        { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : ["/images/hero.jpg"],
      siteName: settings.brand.name,
    },
  };
}

export const viewport: Viewport = { themeColor: "#E93B01", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { settings } = await getSettings();
  return (
    <html
      lang="en"
      data-anim={settings.appearance.animations ? "on" : "off"}
      data-grain={settings.appearance.grain ? "on" : "off"}
      suppressHydrationWarning
    >
      <head>
        <style id="upflit-theme" dangerouslySetInnerHTML={{ __html: themeCss(settings) }} />
      </head>
      <body>
        {children}
        <Analytics />
        <FloatingContact />
      </body>
    </html>
  );
}