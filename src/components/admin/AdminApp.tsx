"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/settings-defaults";
import type { Category, Inquiry, Item, Project } from "@/lib/types";
import { themeCss } from "@/lib/theme";
import { Logo } from "@/components/site/Logo";
import { HeroEditor } from "./HeroEditor";
import { CategoriesModule, PortfolioLayoutModule, ProjectsModule } from "./PortfolioModules";
import { SettingsProvider, useSettings } from "./settings-context";
import { ToastProvider, api } from "./ui";
import {
  AccountModule,
  AppearanceModule,
  BrandModule,
  ContactModule,
  Dashboard,
  InquiriesModule,
  ItemsManager,
  MediaModule,
  NavigationModule,
  SectionsModule,
  SeoModule,
  SocialModule,
  TypographyModule,
  type ModuleId,
} from "./modules";

type Initial = {
  settings: SiteSettings;
  projects: Project[];
  categories: Category[];
  items: Item[];
  inquiries: Inquiry[];
  email: string;
};

const NAV: { group: string; items: { id: ModuleId; label: string; icon: string }[] }[] = [
  { group: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "◎" }] },
  {
    group: "Content",
    items: [
      { id: "hero", label: "Hero Editor", icon: "✦" },
      { id: "sections", label: "Page Sections", icon: "☰" },
      { id: "projects", label: "Portfolio Projects", icon: "▦" },
      { id: "categories", label: "Categories", icon: "◇" },
      { id: "layout", label: "Portfolio Layout", icon: "⊞" },
      { id: "services", label: "Services", icon: "◈" },
      { id: "pricing", label: "Pricing", icon: "৳" },
      { id: "faqs", label: "FAQs", icon: "?" },
      { id: "testimonials", label: "Testimonials", icon: "❝" },
      { id: "media", label: "Media Library", icon: "▣" },
    ],
  },
  {
    group: "Design",
    items: [
      { id: "typography", label: "Typography", icon: "Aa" },
      { id: "appearance", label: "Colors & Appearance", icon: "◐" },
      { id: "brand", label: "Logo & Favicon", icon: "◉" },
    ],
  },
  {
    group: "Settings",
    items: [
      { id: "contact", label: "Contact Information", icon: "✉" },
      { id: "social", label: "Social Links", icon: "↗" },
      { id: "navigation", label: "Navigation & Footer", icon: "≡" },
      { id: "seo", label: "SEO Settings", icon: "⌕" },
    ],
  },
  {
    group: "Inbox & account",
    items: [
      { id: "inquiries", label: "Inquiries", icon: "✉" },
      { id: "account", label: "Account & Security", icon: "🔒" },
    ],
  },
];
const ALL_IDS = NAV.flatMap((g) => g.items.map((i) => i.id));

export function AdminApp({ initial }: { initial: Initial }) {
  return (
    <ToastProvider>
      <SettingsProvider initial={initial.settings}>
        <Shell initial={initial} />
      </SettingsProvider>
    </ToastProvider>
  );
}

function Shell({ initial }: { initial: Initial }) {
  const { draft, dirty } = useSettings();
  const [mod, setMod] = useState<ModuleId>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [projects, setProjects] = useState(initial.projects);
  const [categories, setCategories] = useState(initial.categories);
  const [items, setItems] = useState(initial.items);
  const [inquiries, setInquiries] = useState(initial.inquiries);
  const [email, setEmail] = useState(initial.email);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1) as ModuleId;
      if (ALL_IDS.includes(h)) setMod(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Refresh inquiries when opening the inbox
  useEffect(() => {
    if (mod !== "inquiries" && mod !== "dashboard") return;
    api<{ data: Inquiry[] }>("/api/admin/inquiries").then((r) => setInquiries(r.data)).catch(() => {});
  }, [mod]);

  const go = (m: ModuleId) => {
    setMod(m);
    setMenuOpen(false);
    history.replaceState(null, "", `#${m}`);
    window.scrollTo({ top: 0 });
  };

  const logout = async () => {
    if (dirty && !window.confirm("You have unsaved changes. Log out anyway?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin";
  };

  const newCount = inquiries.filter((i) => i.status === "new").length;
  const shared = { projects, setProjects, categories, setCategories };
  const setItemsFn = (fn: (all: Item[]) => Item[]) => setItems(fn);

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#222]" style={{ fontFamily: "var(--f-body)" }}>
      <style dangerouslySetInnerHTML={{ __html: themeCss(draft) }} />
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#ebe6de] bg-white px-4 py-3 lg:hidden">
        <Logo name={draft.brand.name} height={28} variant="brand" />
        <button className="a-btn a-btn-ghost" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>{menuOpen ? "Close" : "Menu"}</button>
      </div>
      <div className="flex">
        <aside className={`${menuOpen ? "block" : "hidden"} fixed inset-0 top-[57px] z-30 overflow-y-auto bg-[#0d0d0d] text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0`}>
          <div className="hidden px-5 pb-4 pt-6 lg:block">
            <Logo name={draft.brand.name} height={30} />
            <div className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/40">Admin Panel</div>
          </div>
          <nav className="px-3 pb-6" aria-label="Admin">
            {NAV.map((g) => (
              <div key={g.group} className="mt-4">
                <div className="px-3 pb-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-white/35">{g.group}</div>
                {g.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => go(it.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[0.84rem] transition ${mod === it.id ? "bg-[var(--c-primary)] text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="w-5 text-center text-xs opacity-80">{it.icon}</span>
                    <span className="flex-1">{it.label}</span>
                    {it.id === "inquiries" && newCount > 0 && <span className="rounded-full bg-white px-1.5 text-[0.65rem] font-semibold text-[var(--c-primary)]">{newCount}</span>}
                  </button>
                ))}
              </div>
            ))}
            <div className="mt-6 grid gap-2 border-t border-white/10 px-3 pt-4">
              <a href="/" target="_blank" rel="noreferrer" className="text-xs text-white/60 hover:text-white">View website ↗</a>
              <button onClick={logout} className="text-left text-xs text-white/60 hover:text-white">Log out ({email})</button>
            </div>
          </nav>
        </aside>
        <main className="min-w-0 flex-1 px-4 pt-6 md:px-8 md:pt-8">
          {mod === "dashboard" && <Dashboard projects={projects} items={items} inquiries={inquiries} go={go} />}
          {mod === "hero" && <HeroEditor />}
          {mod === "sections" && <SectionsModule />}
          {mod === "projects" && <ProjectsModule {...shared} />}
          {mod === "categories" && <CategoriesModule {...shared} />}
          {mod === "layout" && <PortfolioLayoutModule {...shared} />}
          {mod === "services" && <ItemsManager key="service" kind="service" items={items} setItems={setItemsFn} />}
          {mod === "pricing" && <ItemsManager key="pricing" kind="pricing" items={items} setItems={setItemsFn} />}
          {mod === "faqs" && <ItemsManager key="faq" kind="faq" items={items} setItems={setItemsFn} />}
          {mod === "testimonials" && <ItemsManager key="testimonial" kind="testimonial" items={items} setItems={setItemsFn} />}
          {mod === "media" && <MediaModule />}
          {mod === "typography" && <TypographyModule />}
          {mod === "appearance" && <AppearanceModule />}
          {mod === "brand" && <BrandModule />}
          {mod === "contact" && <ContactModule />}
          {mod === "social" && <SocialModule />}
          {mod === "navigation" && <NavigationModule />}
          {mod === "seo" && <SeoModule />}
          {mod === "inquiries" && <InquiriesModule inquiries={inquiries} setInquiries={setInquiries} />}
          {mod === "account" && <AccountModule email={email} setEmail={setEmail} />}
          <div className="h-10" />
        </main>
      </div>
    </div>
  );
}
