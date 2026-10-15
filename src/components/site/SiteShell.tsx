import type { ReactNode } from "react";
import type { PublicData } from "@/lib/data";
import type { PricingData, ServiceData } from "@/lib/types";
import { Header } from "./Header";
import { AmbientMotion } from "./AmbientMotion";
import { Footer } from "./Sections";
import { Cursor, InquiryModal, RevealObserver } from "./client";

export function inquiryOptions(data: PublicData) {
  const packages = data.items.filter((i) => i.kind === "pricing").map((i) => (i.data as unknown as PricingData).name);
  const services = data.items.filter((i) => i.kind === "service").map((i) => (i.data as unknown as ServiceData).title);
  return { packages, services };
}

export function SiteShell({ data, children }: { data: PublicData; children: ReactNode }) {
  const s = data.settings;
  const { packages, services } = inquiryOptions(data);
  return (
    <>
      <AmbientMotion />
      <Header settings={s} />
      <main className="page-in">{children}</main>
      <Footer s={s} />
      <InquiryModal packages={packages} services={services} />
      <Cursor style={s.appearance.cursor} />
      <RevealObserver />
      {!data.dbOk && (
        <div className="fixed bottom-4 left-4 z-[80] max-w-sm rounded-xl bg-black/85 px-4 py-3 text-xs text-white shadow-xl">
          Database not connected — showing default content. Set <code>DATABASE_URL</code> and start PostgreSQL to enable saving.
        </div>
      )}
    </>
  );
}
