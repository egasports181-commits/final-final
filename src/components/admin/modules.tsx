"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { FONT_OPTIONS, SOCIAL_PLATFORMS, fontStack, type SiteSettings } from "@/lib/settings-defaults";
import type { Inquiry, Item, ItemKind, MediaInfo, Project } from "@/lib/types";
import { Logo } from "@/components/site/Logo";
import { SERVICE_ICONS, ServiceIcon, SocialIcon } from "@/components/site/icons";
import { SaveBar, useSettings } from "./settings-context";
import {
  ColorField,
  DropZone,
  ImageInput,
  MoveButtons,
  PageTitle,
  Panel,
  Segmented,
  Select,
  Slider,
  SortableList,
  StringList,
  TextArea,
  TextField,
  Toggle,
  api,
  confirmDelete,
  uploadFile,
  useToast,
} from "./ui";

export type ModuleId =
  | "dashboard" | "projects" | "categories" | "layout" | "services" | "pricing" | "hero" | "sections" | "media"
  | "typography" | "appearance" | "faqs" | "testimonials" | "contact" | "social" | "navigation" | "seo" | "brand"
  | "inquiries" | "account";

/* =============== Dashboard =============== */
export function Dashboard({ projects, items, inquiries, go }: { projects: Project[]; items: Item[]; inquiries: Inquiry[]; go: (m: ModuleId) => void }) {
  const fresh = inquiries.filter((i) => i.status === "new").length;
  const demo = projects.filter((p) => p.isDemo).length;
  const stats = [
    { label: "Projects", value: projects.length, sub: `${projects.filter((p) => p.published).length} published`, m: "projects" as ModuleId },
    { label: "Featured", value: projects.filter((p) => p.featured).length, sub: "on homepage", m: "projects" as ModuleId },
    { label: "Services", value: items.filter((i) => i.kind === "service").length, sub: "offered", m: "services" as ModuleId },
    { label: "New inquiries", value: fresh, sub: `${inquiries.length} total`, m: "inquiries" as ModuleId },
  ];
  return (
    <div>
      <PageTitle title="Welcome back 👋" desc="Manage everything on your Upflit website from here." actions={<a className="a-btn a-btn-primary" href="/" target="_blank" rel="noreferrer">View website ↗</a>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.m)} className="a-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="text-xs uppercase tracking-wider text-[#9a948c]">{s.label}</div>
            <div className="f-heading mt-2 text-4xl font-semibold tracking-tight text-[#111]">{s.value}</div>
            <div className="mt-1 text-xs text-[#7a746c]">{s.sub}</div>
          </button>
        ))}
      </div>
      {demo > 0 && (
        <div className="mt-5 rounded-2xl border border-[#ffd8c4] bg-[#fff4ee] p-5 text-sm text-[#7a2e0e]">
          <strong>{demo} demo concept project(s)</strong> are shown with a “Concept” badge. Replace them with your real work in{" "}
          <button className="underline" onClick={() => go("projects")}>Portfolio Projects</button>.
        </div>
      )}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Recent inquiries" actions={<button className="a-btn a-btn-ghost text-xs" onClick={() => go("inquiries")}>View all</button>}>
          {inquiries.length === 0 ? <p className="text-sm text-[#9a948c]">No inquiries yet.</p> : inquiries.slice(0, 5).map((q) => (
            <div key={q.id} className="flex items-center justify-between gap-3 border-b border-[#f3efe9] pb-3 last:border-0">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{q.name} {q.packageName && <span className="text-xs text-[var(--c-primary)]">· {q.packageName}</span>}</div>
                <div className="truncate text-xs text-[#9a948c]">{q.message}</div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] ${q.status === "new" ? "bg-[#fff1ea] text-[var(--c-primary)]" : "bg-[#f3efe9] text-[#7a746c]"}`}>{q.status}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Quick actions">
          <div className="grid grid-cols-2 gap-2">
            {([["hero", "Edit hero"], ["projects", "Add project"], ["pricing", "Update pricing"], ["typography", "Change fonts"], ["appearance", "Change colors"], ["sections", "Reorder sections"]] as [ModuleId, string][]).map(([m, l]) => (
              <button key={m} className="a-btn a-btn-ghost justify-center" onClick={() => go(m)}>{l}</button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* =============== Generic items manager (services, pricing, faq, testimonials) =============== */
type FieldDef = { key: string; label: string; type: "text" | "textarea" | "list" | "bool" | "currency" | "icon" | "image" };
const ITEM_CONFIG: Record<ItemKind, { title: string; desc: string; fields: FieldDef[]; label: (d: Record<string, unknown>) => string; blank: Record<string, unknown> }> = {
  service: {
    title: "Services",
    desc: "Services displayed in the What We Create section.",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "icon", label: "Icon", type: "icon" },
    ],
    label: (d) => String(d.title || "Untitled"),
    blank: { title: "New service", description: "", icon: "star" },
  },
  pricing: {
    title: "Pricing",
    desc: "Packages are starting points, not payment. CTA buttons open an inquiry form with the package pre-selected.",
    fields: [
      { key: "name", label: "Package name", type: "text" },
      { key: "price", label: "Price (e.g. 4,999 or 'Let's talk')", type: "text" },
      { key: "currency", label: "Currency", type: "currency" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "deliverables", label: "Deliverables", type: "list" },
      { key: "revisions", label: "Revision allowance", type: "text" },
      { key: "delivery", label: "Estimated delivery time", type: "text" },
      { key: "addons", label: "Optional add-ons", type: "list" },
      { key: "ctaText", label: "Button text", type: "text" },
      { key: "featured", label: "Featured package (highlighted)", type: "bool" },
    ],
    label: (d) => `${d.name || "Untitled"} — ${d.currency === "USD" ? "$" : "৳"}${d.price || ""}`,
    blank: { name: "New package", price: "0", currency: "BDT", description: "", deliverables: [], revisions: "", delivery: "", addons: [], ctaText: "Get Started", featured: false },
  },
  faq: {
    title: "FAQs",
    desc: "Questions shown in the FAQ section.",
    fields: [
      { key: "question", label: "Question", type: "text" },
      { key: "answer", label: "Answer", type: "textarea" },
    ],
    label: (d) => String(d.question || "Untitled"),
    blank: { question: "New question?", answer: "Answer goes here." },
  },
  testimonial: {
    title: "Testimonials",
    desc: "Only publish real testimonials. Hide or delete the sample entries.",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "role", label: "Role / company", type: "text" },
      { key: "quote", label: "Quote", type: "textarea" },
      { key: "avatarUrl", label: "Avatar (optional)", type: "image" },
    ],
    label: (d) => String(d.name || "Untitled"),
    blank: { name: "Client name", role: "", quote: "Their words…", avatarUrl: "" },
  },
};

export function ItemsManager({ kind, items, setItems }: { kind: ItemKind; items: Item[]; setItems: (fn: (all: Item[]) => Item[]) => void }) {
  const cfg = ITEM_CONFIG[kind];
  const toast = useToast();
  const list = items.filter((i) => i.kind === kind);
  const [open, setOpen] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Item>>({});

  const reorder = async (next: Item[]) => {
    setItems((all) => [...all.filter((i) => i.kind !== kind), ...next]);
    try {
      await api("/api/admin/reorder", { method: "POST", json: { resource: "items", ids: next.map((i) => i.id) } });
      toast("success", "Order saved.");
    } catch (e) {
      setItems((all) => [...all.filter((i) => i.kind !== kind), ...list]);
      toast("error", (e as Error).message);
    }
  };
  const save = async (it: Item) => {
    try {
      const res = await api<{ data: Item }>(`/api/admin/items/${it.id}`, { method: "PUT", json: it });
      setItems((all) => all.map((x) => (x.id === it.id ? res.data : x)));
      setDrafts((d) => { const n = { ...d }; delete n[it.id]; return n; });
      toast("success", "Saved. The website is updated.");
    } catch (e) {
      toast("error", `Not saved: ${(e as Error).message}`);
    }
  };
  const add = async () => {
    try {
      const res = await api<{ data: Item }>("/api/admin/items", { method: "POST", json: { kind, data: cfg.blank, visible: true } });
      setItems((all) => [...all, res.data]);
      setOpen(res.data.id);
      toast("success", "Added. Edit the details below.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  const remove = async (it: Item) => {
    if (!confirmDelete(`"${cfg.label(it.data)}"`)) return;
    try {
      await api(`/api/admin/items/${it.id}`, { method: "DELETE" });
      setItems((all) => all.filter((x) => x.id !== it.id));
      toast("success", "Deleted.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  return (
    <div>
      <PageTitle title={cfg.title} desc={`${cfg.desc} Drag to reorder.`} actions={<button className="a-btn a-btn-primary" onClick={add}>+ Add</button>} />
      <SortableList
        items={list}
        getId={(i) => i.id}
        onReorder={reorder}
        render={(it, c) => {
          const d = drafts[it.id] ?? it;
          const dirty = !!drafts[it.id] && JSON.stringify(drafts[it.id]) !== JSON.stringify(it);
          const setField = (key: string, v: unknown) => setDrafts((all) => ({ ...all, [it.id]: { ...d, data: { ...d.data, [key]: v } } }));
          return (
            <div className="a-card">
              <div className="flex flex-wrap items-center gap-2 p-3">
                {c.handle}
                <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setOpen(open === it.id ? null : it.id)}>
                  {kind === "service" && <ServiceIcon name={String(d.data.icon)} size={16} className="mr-2 inline text-[var(--c-primary)]" />}
                  {cfg.label(d.data)}
                  {!d.visible && <span className="ml-2 rounded bg-[#f3efe9] px-1.5 text-[0.65rem] text-[#7a746c]">Hidden</span>}
                  {dirty && <span className="ml-2 text-[0.7rem] text-[var(--c-primary)]">● unsaved</span>}
                </button>
                <MoveButtons c={c} />
                <button className="a-btn a-btn-ghost px-3 py-1 text-xs" onClick={() => setOpen(open === it.id ? null : it.id)}>{open === it.id ? "Close" : "Edit"}</button>
                <button className="a-btn a-btn-danger px-2.5 py-1 text-xs" onClick={() => remove(it)}>Delete</button>
              </div>
              {open === it.id && (
                <div className="grid gap-4 border-t border-[#f3efe9] p-4 md:grid-cols-2">
                  {cfg.fields.map((f) => {
                    const v = d.data[f.key];
                    const full = f.type === "textarea" || f.type === "list" || f.type === "image" || f.type === "icon";
                    return (
                      <div key={f.key} className={full ? "md:col-span-2" : ""}>
                        {f.type === "text" && <TextField label={f.label} value={String(v ?? "")} onChange={(x) => setField(f.key, x)} />}
                        {f.type === "textarea" && <TextArea label={f.label} value={String(v ?? "")} onChange={(x) => setField(f.key, x)} />}
                        {f.type === "list" && <StringList label={f.label} values={Array.isArray(v) ? (v as string[]) : []} onChange={(x) => setField(f.key, x)} />}
                        {f.type === "bool" && <Toggle label={f.label} checked={!!v} onChange={(x) => setField(f.key, x)} />}
                        {f.type === "currency" && <Segmented label={f.label} value={(v as "BDT" | "USD") || "BDT"} onChange={(x) => setField(f.key, x)} options={[{ value: "BDT", label: "BDT ৳" }, { value: "USD", label: "USD $" }]} />}
                        {f.type === "image" && <ImageInput label={f.label} value={String(v ?? "")} onChange={(x) => setField(f.key, x)} previewClass="h-20" />}
                        {f.type === "icon" && (
                          <div>
                            <span className="a-label">{f.label}</span>
                            <div className="flex flex-wrap gap-2">
                              {SERVICE_ICONS.map((ic) => (
                                <button key={ic} type="button" onClick={() => setField(f.key, ic)} className={`grid h-11 w-11 place-items-center rounded-xl border ${v === ic ? "border-[var(--c-primary)] bg-[#fff1ea] text-[var(--c-primary)]" : "border-[#e3ded6]"}`} aria-label={ic}>
                                  <ServiceIcon name={ic} size={20} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
                    <Toggle label="Visible on website" checked={d.visible} onChange={(x) => setDrafts((all) => ({ ...all, [it.id]: { ...d, visible: x } }))} />
                    <div className="flex gap-2">
                      <button className="a-btn a-btn-ghost" disabled={!dirty} onClick={() => setDrafts((all) => { const n = { ...all }; delete n[it.id]; return n; })}>Cancel</button>
                      <button className="a-btn a-btn-primary" disabled={!dirty} onClick={() => save(d)}>Save Changes</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      />
      {list.length === 0 && <Panel><p className="text-sm text-[#9a948c]">Nothing here yet. Click “+ Add”. The section is hidden on the site while empty.</p></Panel>}
    </div>
  );
}

/* =============== Page sections =============== */
export function SectionsModule() {
  const { draft, set, patch } = useSettings();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <PageTitle title="Page Sections" desc="Drag to change the order of homepage sections, toggle visibility, and edit headings. The hero always stays first." />
      <SortableList
        items={draft.sections}
        getId={(s) => s.id}
        onReorder={(next) => set("sections", next)}
        render={(s, c) => {
          const upd = (v: Partial<typeof s>) => set("sections", draft.sections.map((x) => (x.id === s.id ? { ...x, ...v } : x)));
          return (
            <div className="a-card">
              <div className="flex flex-wrap items-center gap-2 p-3">
                {c.handle}
                <span className="w-6 text-xs text-[#9a948c]">{String(c.index + 1).padStart(2, "0")}</span>
                <button className="min-w-0 flex-1 truncate text-left text-sm font-medium" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  {s.title} <span className="text-xs font-normal text-[#9a948c]">({s.id})</span>
                </button>
                <MoveButtons c={c} />
                <button className={`a-btn px-2.5 py-1 text-xs ${s.visible ? "a-btn-ghost" : "a-btn-dark"}`} onClick={() => upd({ visible: !s.visible })}>{s.visible ? "Visible" : "Hidden"}</button>
                <button className="a-btn a-btn-ghost px-3 py-1 text-xs" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Close" : "Edit"}</button>
              </div>
              {open === s.id && (
                <div className="grid gap-3 border-t border-[#f3efe9] p-4 md:grid-cols-2">
                  <TextField label="Eyebrow label" value={s.eyebrow} onChange={(v) => upd({ eyebrow: v })} maxLength={40} />
                  <TextField label="Section title" value={s.title} onChange={(v) => upd({ title: v })} maxLength={80} />
                  <div className="md:col-span-2"><TextArea label="Description" value={s.subtitle} onChange={(v) => upd({ subtitle: v })} maxLength={300} /></div>
                </div>
              )}
            </div>
          );
        }}
      />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Panel title="About section content">
          <TextArea label="About text" rows={5} value={draft.about.text} onChange={(v) => patch("about", { text: v })} />
          <ImageInput label="About image" value={draft.about.imageUrl} onChange={(v) => patch("about", { imageUrl: v })} />
          <span className="a-label">Statistics</span>
          {draft.about.highlights.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input className="a-input w-28" value={h.value} placeholder="Value" onChange={(e) => patch("about", { highlights: draft.about.highlights.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
              <input className="a-input" value={h.label} placeholder="Label" onChange={(e) => patch("about", { highlights: draft.about.highlights.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
              <button className="a-btn a-btn-danger px-2.5" onClick={() => patch("about", { highlights: draft.about.highlights.filter((_, k) => k !== i) })}>✕</button>
            </div>
          ))}
          {draft.about.highlights.length < 4 && <div><button className="a-btn a-btn-ghost" onClick={() => patch("about", { highlights: [...draft.about.highlights, { value: "", label: "" }] })}>+ Add statistic</button></div>}
        </Panel>
        <Panel title="Creative process steps">
          {draft.process.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-[#f0ebe4] p-3">
              <div className="flex gap-2">
                <input className="a-input" value={p.title} placeholder="Step title" onChange={(e) => set("process", draft.process.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} />
                <button className="a-btn a-btn-ghost px-2" disabled={i === 0} onClick={() => { const n = [...draft.process]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set("process", n); }}>↑</button>
                <button className="a-btn a-btn-danger px-2.5" onClick={() => set("process", draft.process.filter((_, k) => k !== i))}>✕</button>
              </div>
              <textarea className="a-input" rows={2} value={p.text} placeholder="Description" onChange={(e) => set("process", draft.process.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
          {draft.process.length < 8 && <div><button className="a-btn a-btn-ghost" onClick={() => set("process", [...draft.process, { title: "New step", text: "" }])}>+ Add step</button></div>}
        </Panel>
      </div>
      <SaveBar resetKeys={["sections", "about", "process"]} />
    </div>
  );
}

/* =============== Media library =============== */
export function MediaModule() {
  const toast = useToast();
  const [media, setMedia] = useState<MediaInfo[] | null>(null);
  const load = async () => {
    try {
      const res = await api<{ data: MediaInfo[] }>("/api/admin/media");
      setMedia(res.data);
    } catch (e) {
      toast("error", (e as Error).message);
      setMedia([]);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const remove = async (m: MediaInfo) => {
    if (!confirmDelete(`"${m.filename}" (anything using it will show a broken image)`)) return;
    try {
      await api(`/api/admin/media/${m.id}`, { method: "DELETE" });
      setMedia((all) => (all || []).filter((x) => x.id !== m.id));
      toast("success", "Image deleted.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  return (
    <div>
      <PageTitle title="Media Library" desc="Images are stored in your PostgreSQL database, so they persist across deploys. Copy a URL to use it anywhere." />
      <DropZone
        multiple
        onFiles={async (files) => {
          let ok = 0;
          for (const f of files) {
            try { await uploadFile(f); ok++; } catch (e) { toast("error", `${f.name}: ${(e as Error).message}`); }
          }
          if (ok) toast("success", `${ok} image(s) uploaded.`);
          load();
        }}
      />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {media === null && <p className="text-sm text-[#9a948c]">Loading…</p>}
        {media?.length === 0 && <p className="col-span-full text-sm text-[#9a948c]">No uploads yet.</p>}
        {media?.map((m) => (
          <div key={m.id} className="a-card overflow-hidden">
            <div className="aspect-square bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
              <img src={m.url} alt="" className="h-full w-full object-contain" loading="lazy" />
            </div>
            <div className="p-2">
              <div className="truncate text-xs font-medium">{m.filename}</div>
              <div className="text-[0.65rem] text-[#9a948c]">{Math.round(m.size / 1024)} KB</div>
              <div className="mt-2 flex gap-1">
                <button className="a-btn a-btn-ghost flex-1 justify-center px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(m.url).then(() => toast("info", `Copied ${m.url}`))}>Copy URL</button>
                <button className="a-btn a-btn-danger px-2 py-1 text-xs" onClick={() => remove(m)} aria-label="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =============== Typography =============== */
export function TypographyModule() {
  const { draft, patch } = useSettings();
  const t = draft.typography;
  const set = (v: Partial<SiteSettings["typography"]>) => patch("typography", v);
  return (
    <div>
      <PageTitle title="Typography" desc="Poppins is the default. Choose from the bundled professional fonts and tune sizes within safe limits." />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="grid content-start gap-5">
          <Panel title="Fonts">
            <Select label="Display / hero font" value={t.displayFont} onChange={(v) => set({ displayFont: v })} options={FONT_OPTIONS} />
            <Select label="Heading font" value={t.headingFont} onChange={(v) => set({ headingFont: v })} options={FONT_OPTIONS} />
            <Select label="Body font" value={t.bodyFont} onChange={(v) => set({ bodyFont: v })} options={FONT_OPTIONS} />
          </Panel>
          <Panel title="Sizes">
            <Slider label="Hero headline max size" value={t.heroSize} min={56} max={200} unit="px" onChange={(v) => set({ heroSize: v })} />
            <Slider label="Section title max size" value={t.sectionSize} min={36} max={120} unit="px" onChange={(v) => set({ sectionSize: v })} />
            <Slider label="Body text size" value={t.bodySize} min={14} max={20} unit="px" onChange={(v) => set({ bodySize: v })} />
            <Slider label="Heading weight" value={t.headingWeight} min={300} max={700} step={100} onChange={(v) => set({ headingWeight: v })} />
            <Slider label="Heading letter spacing" value={t.letterSpacing} min={-8} max={4} unit="/100 em" onChange={(v) => set({ letterSpacing: v })} />
            <p className="text-[0.7rem] text-[#9a948c]">Sizes scale down automatically on smaller screens (responsive clamp).</p>
          </Panel>
        </div>
        <Panel title="Live specimen">
          <div className="brand-gradient overflow-hidden rounded-2xl p-6 text-white md:p-10">
            <div className="eyebrow opacity-80">01/ Eyebrow label</div>
            <div className="t-hero mt-3" style={{ fontFamily: fontStack(t.displayFont) }}>Creative<br />Studio</div>
            <div className="t-section mt-8" style={{ fontFamily: fontStack(t.headingFont) }}>Section Title</div>
            <p className="t-lead mt-4 max-w-lg opacity-90" style={{ fontFamily: fontStack(t.bodyFont) }}>
              Body text — From logos and identities to thumbnails, posters and digital products, design that makes people stop and look.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="btn btn-primary">Button</span>
              <span className="btn btn-ghost">Secondary</span>
            </div>
          </div>
        </Panel>
      </div>
      <SaveBar resetKeys={["typography"]} />
    </div>
  );
}

/* =============== Colors & appearance =============== */
export function AppearanceModule() {
  const { draft, patch } = useSettings();
  const c = draft.colors;
  const a = draft.appearance;
  const h = draft.hero;
  return (
    <div>
      <PageTitle title="Colors & Appearance" desc="Brand colors, gradient, corner radius, buttons, animation and cursor." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Brand colors">
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Primary orange" value={c.primary} onChange={(v) => patch("colors", { primary: v })} />
            <ColorField label="Bright orange" value={c.bright} onChange={(v) => patch("colors", { bright: v })} />
            <ColorField label="Deep red" value={c.deep} onChange={(v) => patch("colors", { deep: v })} />
            <ColorField label="Near black" value={c.dark} onChange={(v) => patch("colors", { dark: v })} />
            <ColorField label="Warm white" value={c.light} onChange={(v) => patch("colors", { light: v })} />
            <ColorField label="Muted gray" value={c.muted} onChange={(v) => patch("colors", { muted: v })} />
          </div>
        </Panel>
        <Panel title="Background gradient" desc="Used by the hero, services, contact and highlighted cards.">
          <div className="h-20 rounded-xl" style={{ background: `linear-gradient(${h.gradAngle}deg, ${h.gradFrom}, ${h.gradVia} 50%, ${h.gradTo})` }} />
          <div className="grid grid-cols-3 gap-2">
            <ColorField label="From" value={h.gradFrom} onChange={(v) => patch("hero", { gradFrom: v })} />
            <ColorField label="Middle" value={h.gradVia} onChange={(v) => patch("hero", { gradVia: v })} />
            <ColorField label="To" value={h.gradTo} onChange={(v) => patch("hero", { gradTo: v })} />
          </div>
          <Slider label="Angle" value={h.gradAngle} min={0} max={360} unit="°" onChange={(v) => patch("hero", { gradAngle: v })} />
        </Panel>
        <Panel title="Shape & buttons">
          <Slider label="Card border radius" value={a.radius} min={0} max={40} unit="px" onChange={(v) => patch("appearance", { radius: v })} />
          <Segmented label="Button style" value={a.buttonStyle} onChange={(v) => patch("appearance", { buttonStyle: v })} options={[{ value: "pill", label: "Pill" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }]} />
          <div className="flex flex-wrap gap-3 rounded-xl bg-[var(--c-dark)] p-4">
            <span className="btn btn-primary">Primary</span>
            <span className="btn btn-accent">Accent</span>
            <span className="btn btn-ghost">Ghost</span>
          </div>
        </Panel>
        <Panel title="Motion & effects">
          <Toggle label="Enable animations" hint="Visitors with reduced-motion preferences never see motion" checked={a.animations} onChange={(v) => patch("appearance", { animations: v })} />
          <Slider label="Animation speed" value={a.animationSpeed} min={0.5} max={2} step={0.1} unit="×" onChange={(v) => patch("appearance", { animationSpeed: v })} />
          <Toggle label="Film grain texture" checked={a.grain} onChange={(v) => patch("appearance", { grain: v })} />
          <Segmented label="Cursor style (desktop)" value={a.cursor} onChange={(v) => patch("appearance", { cursor: v })} options={[{ value: "default", label: "Default" }, { value: "dot", label: "Dot" }, { value: "ring", label: "Ring" }]} />
        </Panel>
      </div>
      <SaveBar resetKeys={["colors", "appearance"]} />
    </div>
  );
}

/* =============== Contact / Social / Navigation / SEO / Brand =============== */
export function ContactModule() {
  const { draft, patch } = useSettings();
  const c = draft.contact;
  return (
    <div>
      <PageTitle title="Contact Information" desc="Shown in the contact section, menu and footer." />
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Email" type="email" value={c.email} onChange={(v) => patch("contact", { email: v })} />
          <TextField label="Phone" value={c.phone} onChange={(v) => patch("contact", { phone: v })} />
          <TextField label="WhatsApp number (optional)" value={c.whatsapp} onChange={(v) => patch("contact", { whatsapp: v })} hint="International format, e.g. 8801700000000" />
          <TextField label="Location" value={c.location} onChange={(v) => patch("contact", { location: v })} />
          <TextField label="Availability" value={c.availability} onChange={(v) => patch("contact", { availability: v })} />
          <TextField label="Response time" value={c.responseTime} onChange={(v) => patch("contact", { responseTime: v })} />
        </div>
      </Panel>
      <SaveBar resetKeys={["contact"]} />
    </div>
  );
}

export function SocialModule() {
  const { draft, set } = useSettings();
  return (
    <div>
      <PageTitle title="Social Links" desc="The first three appear in the header; all appear in the footer and menu. Drag to reorder." />
      <SortableList
        items={draft.social.map((s, i) => ({ ...s, _k: `${i}` }))}
        getId={(s) => s._k}
        onReorder={(next) => set("social", next.map(({ platform, url }) => ({ platform, url })))}
        render={(s, c) => (
          <div className="a-card flex flex-wrap items-center gap-2 p-3">
            {c.handle}
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[#111] text-white"><SocialIcon platform={s.platform} /></span>
            <select className="a-input w-36" value={s.platform} onChange={(e) => set("social", draft.social.map((x, k) => (k === c.index ? { ...x, platform: e.target.value } : x)))}>
              {SOCIAL_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className="a-input min-w-[12rem] flex-1" value={s.url} placeholder="https://" onChange={(e) => set("social", draft.social.map((x, k) => (k === c.index ? { ...x, url: e.target.value } : x)))} />
            <MoveButtons c={c} />
            <button className="a-btn a-btn-danger px-2.5" onClick={() => set("social", draft.social.filter((_, k) => k !== c.index))}>✕</button>
          </div>
        )}
      />
      <button className="a-btn a-btn-ghost mt-3" onClick={() => set("social", [...draft.social, { platform: "website", url: "https://" }])}>+ Add link</button>
      <SaveBar resetKeys={["social"]} />
    </div>
  );
}

export function NavigationModule() {
  const { draft, set, patch } = useSettings();
  return (
    <div>
      <PageTitle title="Navigation & Footer" desc="Menu links (use #work, #services, #pricing, #about, #contact, #faq or full URLs) and footer text." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Menu links">
          <SortableList
            items={draft.nav.map((n, i) => ({ ...n, _k: `${i}` }))}
            getId={(n) => n._k}
            onReorder={(next) => set("nav", next.map(({ label, href }) => ({ label, href })))}
            render={(n, c) => (
              <div className="flex items-center gap-2">
                {c.handle}
                <input className="a-input" value={n.label} placeholder="Label" onChange={(e) => set("nav", draft.nav.map((x, k) => (k === c.index ? { ...x, label: e.target.value } : x)))} />
                <input className="a-input" value={n.href} placeholder="#section or URL" onChange={(e) => set("nav", draft.nav.map((x, k) => (k === c.index ? { ...x, href: e.target.value } : x)))} />
                <button className="a-btn a-btn-danger px-2.5" onClick={() => set("nav", draft.nav.filter((_, k) => k !== c.index))}>✕</button>
              </div>
            )}
          />
          {draft.nav.length < 8 && <div><button className="a-btn a-btn-ghost" onClick={() => set("nav", [...draft.nav, { label: "Link", href: "#" }])}>+ Add link</button></div>}
        </Panel>
        <Panel title="Footer">
          <TextField label="Call-to-action title" value={draft.footer.ctaTitle} onChange={(v) => patch("footer", { ctaTitle: v })} />
          <TextArea label="Tagline" value={draft.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} />
          <TextField label="Copyright (© is replaced with © + current year)" value={draft.footer.copyright} onChange={(v) => patch("footer", { copyright: v })} />
        </Panel>
      </div>
      <SaveBar resetKeys={["nav", "footer"]} />
    </div>
  );
}

export function SeoModule() {
  const { draft, patch } = useSettings();
  const s = draft.seo;
  return (
    <div>
      <PageTitle title="SEO Settings" desc="How your site appears in search engines and social shares." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <TextField label="Page title" value={s.title} onChange={(v) => patch("seo", { title: v })} maxLength={70} hint={`${s.title.length}/60 recommended`} />
          <TextArea label="Meta description" value={s.description} onChange={(v) => patch("seo", { description: v })} maxLength={300} />
          <TextField label="Keywords" value={s.keywords} onChange={(v) => patch("seo", { keywords: v })} />
          <ImageInput label="Social share image (1200×630 recommended)" value={s.ogImage} onChange={(v) => patch("seo", { ogImage: v })} />
        </Panel>
        <Panel title="Search preview">
          <div className="rounded-xl border border-[#ebe6de] p-4">
            <div className="text-xs text-[#5f6368]">yourdomain.com</div>
            <div className="mt-1 text-lg text-[#1a0dab]">{s.title}</div>
            <div className="mt-1 text-sm text-[#4d5156]">{s.description.slice(0, 160)}</div>
          </div>
        </Panel>
      </div>
      <SaveBar resetKeys={["seo"]} />
    </div>
  );
}

export function BrandModule() {
  const { draft, patch } = useSettings();
  const b = draft.brand;
  return (
    <div>
      <PageTitle title="Logo & Favicon" desc="Leave the logo empty to use the built-in Upflit logo (rendered with your website name)." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Brand">
          <TextField label="Website name" value={b.name} onChange={(v) => patch("brand", { name: v })} maxLength={40} />
          <TextField label="Tagline" value={b.tagline} onChange={(v) => patch("brand", { tagline: v })} maxLength={80} />
          <ImageInput label="Custom logo (SVG/PNG, light version for dark/orange backgrounds)" value={b.logoUrl} onChange={(v) => patch("brand", { logoUrl: v })} />
          <Slider label="Logo display height" value={b.logoHeight} min={18} max={90} unit="px" onChange={(v) => patch("brand", { logoHeight: v })} />
          <ImageInput label="Custom favicon (SVG, PNG or ICO, square)" value={b.faviconUrl} onChange={(v) => patch("brand", { faviconUrl: v })} hint="Default: /favicon.svg. Browsers cache favicons — hard refresh to see changes." previewClass="h-16" />
        </Panel>
        <Panel title="Preview">
          <div className="brand-gradient flex items-center rounded-xl p-6"><Logo name={b.name} logoUrl={b.logoUrl} height={b.logoHeight} /></div>
          <div className="flex items-center rounded-xl bg-[#080808] p-6"><Logo name={b.name} logoUrl={b.logoUrl} height={b.logoHeight} /></div>
          <div className="flex items-center gap-3 rounded-xl border border-[#ebe6de] p-4 text-sm">
            <img src={b.faviconUrl || "/favicon.svg"} alt="" className="h-8 w-8" /> Browser tab icon
          </div>
          <div className="text-xs text-[#9a948c]">
            Brand files included: <a className="underline" href="/brand/logo-light.svg" target="_blank">logo-light.svg</a> · <a className="underline" href="/brand/logo-dark.svg" target="_blank">logo-dark.svg</a> · <a className="underline" href="/brand/logo-mark.svg" target="_blank">logo-mark.svg</a> · <a className="underline" href="/favicon.svg" target="_blank">favicon.svg</a>
          </div>
        </Panel>
      </div>
      <SaveBar resetKeys={["brand"]} />
    </div>
  );
}

/* =============== Inquiries =============== */
export function InquiriesModule({ inquiries, setInquiries }: { inquiries: Inquiry[]; setInquiries: (fn: (i: Inquiry[]) => Inquiry[]) => void }) {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "new" | "read" | "replied" | "archived">("all");
  const list = filter === "all" ? inquiries : inquiries.filter((i) => i.status === filter);
  const setStatus = async (q: Inquiry, status: string) => {
    try {
      await api(`/api/admin/inquiries/${q.id}`, { method: "PUT", json: { status } });
      setInquiries((all) => all.map((x) => (x.id === q.id ? { ...x, status } : x)));
      toast("success", `Marked as ${status}.`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  const remove = async (q: Inquiry) => {
    if (!confirmDelete(`inquiry from ${q.name}`)) return;
    try {
      await api(`/api/admin/inquiries/${q.id}`, { method: "DELETE" });
      setInquiries((all) => all.filter((x) => x.id !== q.id));
      toast("success", "Inquiry deleted.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  return (
    <div>
      <PageTitle title="Inquiries" desc="Messages submitted through the contact and pricing forms." />
      <div className="mb-4 max-w-xl">
        <Segmented value={filter} onChange={setFilter} options={(["all", "new", "read", "replied", "archived"] as const).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />
      </div>
      <div className="grid gap-3">
        {list.length === 0 && <Panel><p className="text-sm text-[#9a948c]">No inquiries here.</p></Panel>}
        {list.map((q) => (
          <article key={q.id} className="a-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{q.name} <a href={`mailto:${q.email}`} className="ml-1 font-normal text-[var(--c-primary)] underline">{q.email}</a></div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[0.7rem] text-[#7a746c]">
                  <span>{new Date(q.createdAt).toLocaleString()}</span>
                  {q.packageName && <span className="rounded bg-[#fff1ea] px-1.5 text-[var(--c-primary)]">{q.packageName}</span>}
                  {q.service && <span className="rounded bg-[#f3efe9] px-1.5">{q.service}</span>}
                  {q.budget && <span className="rounded bg-[#f3efe9] px-1.5">Budget: {q.budget}</span>}
                </div>
              </div>
              <div className="flex gap-1.5">
                <select className="a-input w-32 py-1 text-xs" value={q.status} onChange={(e) => setStatus(q, e.target.value)} aria-label="Status">
                  {["new", "read", "replied", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <a className="a-btn a-btn-ghost px-2.5 py-1 text-xs" href={`mailto:${q.email}?subject=${encodeURIComponent("Re: your project inquiry")}`}>Reply</a>
                <button className="a-btn a-btn-danger px-2.5 py-1 text-xs" onClick={() => remove(q)}>Delete</button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-[#333]">{q.message}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

/* =============== Account =============== */
export function AccountModule({ email, setEmail }: { email: string; setEmail: (e: string) => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [newEmail, setNewEmail] = useState(email);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pw && pw !== pw2) return toast("error", "New passwords do not match.");
    if (pw && pw.length < 8) return toast("error", "New password must be at least 8 characters.");
    setBusy(true);
    try {
      const res = await api<{ email: string }>("/api/auth/account", { method: "POST", json: { currentPassword: current, newEmail, newPassword: pw || undefined } });
      setEmail(res.email);
      setCurrent(""); setPw(""); setPw2("");
      toast("success", "Account updated.");
    } catch (e) {
      toast("error", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PageTitle title="Account & Security" desc={`Signed in as ${email}.`} />
      <div className="max-w-xl">
        <Panel title="Change login email or password" desc="If you are still using the default password, change it now.">
          <TextField label="Login email" type="email" value={newEmail} onChange={setNewEmail} />
          <TextField label="New password (leave blank to keep)" type="password" value={pw} onChange={setPw} />
          <TextField label="Confirm new password" type="password" value={pw2} onChange={setPw2} />
          <TextField label="Current password *" type="password" value={current} onChange={setCurrent} />
          <div><button className="a-btn a-btn-primary" disabled={busy || !current} onClick={submit}>{busy ? "Saving…" : "Update account"}</button></div>
        </Panel>
      </div>
    </div>
  );
}
