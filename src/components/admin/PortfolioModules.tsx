"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ASPECT_PRESETS, newImage, type ProjectImage } from "@/lib/image";
import { slugify } from "@/lib/settings-defaults";
import type { Category, Project } from "@/lib/types";
import { PortfolioGrid } from "@/components/site/client";
import { ImageEditor } from "./ImageEditor";
import { SaveBar, useSettings } from "./settings-context";
import {
  DropZone,
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

type Shared = {
  projects: Project[];
  setProjects: (p: Project[]) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
};

const blankProject = (): Project => ({
  id: 0,
  title: "",
  slug: "",
  categoryId: null,
  summary: "",
  description: "",
  details: [],
  tags: [],
  cover: null,
  gallery: [],
  featured: false,
  published: true,
  isDemo: false,
  sortOrder: 0,
});

/* =============== Projects =============== */
export function ProjectsModule({ projects, setProjects, categories }: Shared) {
  const [editing, setEditing] = useState<Project | null>(null);
  const toast = useToast();
  const catName = (id: number | null) => categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  const reorder = async (next: Project[]) => {
    const prev = projects;
    setProjects(next);
    try {
      await api("/api/admin/reorder", { method: "POST", json: { resource: "projects", ids: next.map((p) => p.id) } });
      toast("success", "Project order saved.");
    } catch (e) {
      setProjects(prev);
      toast("error", `Order not saved: ${(e as Error).message}`);
    }
  };

  const quickToggle = async (p: Project, key: "featured" | "published") => {
    try {
      const res = await api<{ data: Project }>(`/api/admin/projects/${p.id}`, { method: "PUT", json: { ...p, [key]: !p[key] } });
      setProjects(projects.map((x) => (x.id === p.id ? res.data : x)));
      toast("success", `${p.title}: ${key} ${!p[key] ? "on" : "off"}.`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  const remove = async (p: Project) => {
    if (!confirmDelete(`"${p.title}"`)) return;
    try {
      await api(`/api/admin/projects/${p.id}`, { method: "DELETE" });
      setProjects(projects.filter((x) => x.id !== p.id));
      toast("success", "Project deleted.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  if (editing) {
    return (
      <ProjectEditor
        initial={editing}
        categories={categories}
        onCancel={() => setEditing(null)}
        onSaved={(saved, isNew) => {
          setProjects(isNew ? [...projects, saved] : projects.map((x) => (x.id === saved.id ? saved : x)));
          setEditing(saved);
        }}
      />
    );
  }

  return (
    <div>
      <PageTitle
        title="Portfolio Projects"
        desc="Drag rows (or use the arrows) to reorder. Order is saved automatically."
        actions={<button className="a-btn a-btn-primary" onClick={() => setEditing(blankProject())}>+ New project</button>}
      />
      {projects.length === 0 ? (
        <Panel><p className="text-sm text-[#7a746c]">No projects yet. Create your first one.</p></Panel>
      ) : (
        <SortableList
          items={projects}
          getId={(p) => p.id}
          onReorder={reorder}
          render={(p, c) => (
            <div className="a-card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              {c.handle}
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#eee]">
                {p.cover && <img src={p.cover.url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[#111]">{p.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5 text-[0.7rem] text-[#7a746c]">
                  <span>{catName(p.categoryId)}</span>
                  {p.isDemo && <span className="rounded bg-[#f3efe9] px-1.5">Demo</span>}
                  {!p.published && <span className="rounded bg-[#fde8e8] px-1.5 text-[#9b1c1c]">Draft</span>}
                  {p.featured && <span className="rounded bg-[#fff1ea] px-1.5 text-[var(--c-primary)]">★ Featured</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <MoveButtons c={c} />
                <button className="a-btn a-btn-ghost px-2.5 py-1 text-xs" onClick={() => quickToggle(p, "featured")}>{p.featured ? "Unfeature" : "Feature"}</button>
                <button className="a-btn a-btn-ghost px-2.5 py-1 text-xs" onClick={() => quickToggle(p, "published")}>{p.published ? "Unpublish" : "Publish"}</button>
                <button className="a-btn a-btn-dark px-3 py-1 text-xs" onClick={() => setEditing(p)}>Edit</button>
                <button className="a-btn a-btn-danger px-2.5 py-1 text-xs" onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          )}
        />
      )}
    </div>
  );
}

function ProjectEditor({ initial, categories, onCancel, onSaved }: { initial: Project; categories: Category[]; onCancel: () => void; onSaved: (p: Project, isNew: boolean) => void }) {
  const [p, setP] = useState<Project>(initial);
  const [selected, setSelected] = useState<string>("cover");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { saved: settings } = useSettings();
  const isNew = !p.id;
  const preset = categories.find((c) => c.id === p.categoryId)?.preset || "16:9";
  const dirty = JSON.stringify(p) !== JSON.stringify(initial);

  const upd = (patch: Partial<Project>) => setP((x) => ({ ...x, ...patch }));

  const addFiles = async (files: File[], target: "cover" | "gallery") => {
    for (const f of files) {
      try {
        const r = await uploadFile(f);
        const img = newImage(r.url, preset, r.natural);
        if (target === "cover") {
          setP((x) => ({ ...x, cover: img }));
          setSelected("cover");
        } else {
          setP((x) => ({ ...x, gallery: [...x.gallery, img] }));
          setSelected(img.id);
        }
      } catch (e) {
        toast("error", `${f.name}: ${(e as Error).message}`);
      }
    }
    toast("success", "Upload complete. Click Save Project to keep the changes.");
  };

  const save = async () => {
    if (!p.title.trim()) return toast("error", "Please enter a project title.");
    setSaving(true);
    try {
      const res = await api<{ data: Project }>(isNew ? "/api/admin/projects" : `/api/admin/projects/${p.id}`, {
        method: isNew ? "POST" : "PUT",
        json: p,
      });
      setP(res.data);
      onSaved(res.data, isNew);
      toast("success", `"${res.data.title}" saved. Live at /work/${res.data.slug}`);
    } catch (e) {
      toast("error", `Not saved: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedImage: ProjectImage | null = selected === "cover" ? p.cover : p.gallery.find((g) => g.id === selected) ?? null;
  const updateSelected = (img: ProjectImage) => {
    if (selected === "cover") upd({ cover: img });
    else upd({ gallery: p.gallery.map((g) => (g.id === img.id ? img : g)) });
  };

  return (
    <div>
      <PageTitle
        title={isNew ? "New project" : `Edit: ${initial.title}`}
        actions={
          <>
            <button className="a-btn a-btn-ghost" onClick={() => (!dirty || window.confirm("Discard unsaved changes?")) && onCancel()}>← Back to list</button>
            {!isNew && p.published && <a className="a-btn a-btn-ghost" href={`/work/${p.slug}`} target="_blank" rel="noreferrer">View live ↗</a>}
          </>
        }
      />
      <div className="grid gap-5">
        <Panel title="Project details">
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Title *" value={p.title} onChange={(v) => upd({ title: v, slug: isNew || !p.slug ? slugify(v) : p.slug })} maxLength={160} />
            <TextField label="URL slug" value={p.slug} onChange={(v) => upd({ slug: v })} hint={`/work/${slugify(p.slug || p.title || "project")}`} />
            <Select
              label="Category"
              value={String(p.categoryId ?? "")}
              onChange={(v) => upd({ categoryId: v ? Number(v) : null })}
              options={[{ value: "", label: "— Uncategorized —" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]}
            />
            <TextField label="Tags (comma separated)" value={p.tags.join(", ")} onChange={(v) => upd({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <TextField label="Short summary" value={p.summary} onChange={(v) => upd({ summary: v })} maxLength={400} />
          <TextArea label="Description" rows={6} value={p.description} onChange={(v) => upd({ description: v })} maxLength={8000} />
          <div>
            <span className="a-label">Project details (optional)</span>
            <div className="grid gap-2">
              {p.details.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input className="a-input w-1/3" placeholder="Label (e.g. Client)" value={d.label} onChange={(e) => upd({ details: p.details.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                  <input className="a-input" placeholder="Value" value={d.value} onChange={(e) => upd({ details: p.details.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
                  <button className="a-btn a-btn-danger px-2.5" onClick={() => upd({ details: p.details.filter((_, k) => k !== i) })} aria-label="Remove">✕</button>
                </div>
              ))}
              <div><button className="a-btn a-btn-ghost" onClick={() => upd({ details: [...p.details, { label: "", value: "" }] })}>+ Add detail</button></div>
            </div>
          </div>
          <div className="grid gap-3 border-t border-[#f0ebe4] pt-4 md:grid-cols-3">
            <Toggle label="Published" hint="Visible on the website" checked={p.published} onChange={(v) => upd({ published: v })} />
            <Toggle label="Featured" hint="Show in Featured Work" checked={p.featured} onChange={(v) => upd({ featured: v })} />
            <Toggle label="Demo / concept" hint="Shows a 'Concept' badge" checked={p.isDemo} onChange={(v) => upd({ isDemo: v })} />
          </div>
        </Panel>

        <Panel title="Images" desc={`Default aspect for "${categories.find((c) => c.id === p.categoryId)?.name ?? "this category"}": ${preset}. Every image keeps its own independent display settings.`}>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <span className="a-label">Cover image</span>
              {p.cover ? (
                <button type="button" onClick={() => setSelected("cover")} className={`block w-full overflow-hidden rounded-xl border-2 ${selected === "cover" ? "border-[var(--c-primary)]" : "border-transparent"}`}>
                  <img src={p.cover.url} alt="" className="aspect-video w-full object-cover" />
                </button>
              ) : null}
              <div className="mt-2"><DropZone compact label={p.cover ? "Replace cover" : "Upload cover"} onFiles={(f) => addFiles(f, "cover")} /></div>
              {p.cover && <button className="a-btn a-btn-danger mt-2 w-full justify-center text-xs" onClick={() => { upd({ cover: null }); setSelected(p.gallery[0]?.id ?? "cover"); }}>Remove cover</button>}
            </div>
            <div>
              <span className="a-label">Gallery ({p.gallery.length}) — drag to reorder</span>
              <SortableList
                grid
                className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6"
                items={p.gallery}
                getId={(g) => g.id}
                onReorder={(next) => upd({ gallery: next })}
                render={(g, c) => (
                  <div className={`group relative overflow-hidden rounded-xl border-2 bg-[#eee] ${selected === g.id ? "border-[var(--c-primary)]" : "border-transparent"}`}>
                    <button type="button" className="block w-full" onClick={() => setSelected(g.id)} aria-label={`Edit image ${c.index + 1}`}>
                      <img src={g.url} alt="" className="aspect-square w-full object-cover" />
                    </button>
                    <div className="absolute left-1 top-1 rounded-lg bg-white/90">{c.handle}</div>
                    <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                      <span className="flex gap-0.5">
                        <button type="button" disabled={c.isFirst} onClick={c.moveUp} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40" aria-label="Move left">←</button>
                        <button type="button" disabled={c.isLast} onClick={c.moveDown} className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40" aria-label="Move right">→</button>
                      </span>
                      <button type="button" onClick={() => { upd({ gallery: p.gallery.filter((x) => x.id !== g.id) }); if (selected === g.id) setSelected("cover"); }} className="rounded bg-white/90 px-1.5 text-xs text-red-700" aria-label="Remove image">✕</button>
                    </div>
                  </div>
                )}
              />
              <div className="mt-2"><DropZone multiple compact label="Drop gallery images here (multiple allowed)" onFiles={(f) => addFiles(f, "gallery")} /></div>
            </div>
          </div>
          {selectedImage ? (
            <div className="border-t border-[#f0ebe4] pt-5">
              <div className="mb-3 text-sm font-semibold text-[#111]">
                Image size editor — {selected === "cover" ? "Cover" : `Gallery image ${p.gallery.findIndex((g) => g.id === selected) + 1}`}
              </div>
              <ImageEditor
                key={selectedImage.id}
                image={selectedImage}
                onChange={updateSelected}
                gridAspect={settings.portfolio.aspect}
                gridRadius={settings.portfolio.radius}
                defaultAspect={preset}
              />
            </div>
          ) : (
            <p className="text-sm text-[#9a948c]">Upload an image to open the image size editor.</p>
          )}
        </Panel>
      </div>
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe6de] bg-white/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <span className={`text-xs ${dirty ? "font-medium text-[var(--c-primary)]" : "text-[#9a948c]"}`}>{dirty ? "● Unsaved changes" : "No unsaved changes"}</span>
        <div className="flex gap-2">
          <button className="a-btn a-btn-ghost" disabled={!dirty || saving} onClick={() => setP(initial)}>Cancel changes</button>
          <button className="a-btn a-btn-primary" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Project"}</button>
        </div>
      </div>
    </div>
  );
}

/* =============== Categories =============== */
export function CategoriesModule({ categories, setCategories, projects }: Shared) {
  const toast = useToast();
  const [rows, setRows] = useState<Category[]>(categories);
  const [newName, setNewName] = useState("");
  const original = (id: number) => categories.find((c) => c.id === id);

  const reorder = async (next: Category[]) => {
    setRows(next);
    try {
      await api("/api/admin/reorder", { method: "POST", json: { resource: "categories", ids: next.map((c) => c.id) } });
      setCategories(next);
      toast("success", "Category order saved.");
    } catch (e) {
      setRows(categories);
      toast("error", (e as Error).message);
    }
  };
  const saveRow = async (c: Category) => {
    try {
      const res = await api<{ data: Category }>(`/api/admin/categories/${c.id}`, { method: "PUT", json: c });
      const next = rows.map((x) => (x.id === c.id ? res.data : x));
      setRows(next);
      setCategories(next);
      toast("success", `Category "${res.data.name}" saved.`);
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  const add = async () => {
    if (!newName.trim()) return;
    try {
      const res = await api<{ data: Category }>("/api/admin/categories", { method: "POST", json: { name: newName, preset: "4:3", visible: true } });
      const next = [...rows, res.data];
      setRows(next);
      setCategories(next);
      setNewName("");
      toast("success", "Category added.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };
  const remove = async (c: Category) => {
    const used = projects.filter((p) => p.categoryId === c.id).length;
    if (!confirmDelete(`category "${c.name}"${used ? ` (${used} project(s) will become uncategorized)` : ""}`)) return;
    try {
      await api(`/api/admin/categories/${c.id}`, { method: "DELETE" });
      const next = rows.filter((x) => x.id !== c.id);
      setRows(next);
      setCategories(next);
      toast("success", "Category deleted.");
    } catch (e) {
      toast("error", (e as Error).message);
    }
  };

  return (
    <div>
      <PageTitle title="Categories" desc="Rename, reorder, hide or delete categories. The aspect preset is the default crop for new images in that category." />
      <Panel>
        <div className="flex gap-2">
          <input className="a-input" placeholder="New category name" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="a-btn a-btn-primary" onClick={add}>Add</button>
        </div>
      </Panel>
      <div className="mt-4">
        <SortableList
          items={rows}
          getId={(c) => c.id}
          onReorder={reorder}
          render={(c, ctl) => {
            const dirty = JSON.stringify(c) !== JSON.stringify(original(c.id));
            const set = (patch: Partial<Category>) => setRows(rows.map((x) => (x.id === c.id ? { ...x, ...patch } : x)));
            return (
              <div className="a-card flex flex-wrap items-center gap-2 p-3">
                {ctl.handle}
                <input className="a-input min-w-[10rem] flex-1" value={c.name} onChange={(e) => set({ name: e.target.value })} aria-label="Category name" />
                <select className="a-input w-36" value={c.preset} onChange={(e) => set({ preset: e.target.value })} aria-label="Aspect preset">
                  {ASPECT_PRESETS.filter((a) => a.value !== "custom").map((a) => <option key={a.value} value={a.value}>{a.label} · {a.hint}</option>)}
                </select>
                <span className="text-xs text-[#9a948c]">{projects.filter((p) => p.categoryId === c.id).length} projects</span>
                <button className={`a-btn px-2.5 py-1 text-xs ${c.visible ? "a-btn-ghost" : "a-btn-dark"}`} onClick={() => set({ visible: !c.visible })}>{c.visible ? "Visible" : "Hidden"}</button>
                <MoveButtons c={ctl} />
                <button className="a-btn a-btn-primary px-3 py-1 text-xs" disabled={!dirty} onClick={() => saveRow(c)}>Save</button>
                <button className="a-btn a-btn-danger px-2.5 py-1 text-xs" onClick={() => remove(c)}>Delete</button>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

/* =============== Portfolio layout =============== */
export function PortfolioLayoutModule({ projects, categories }: Shared) {
  const { draft, patch } = useSettings();
  const l = draft.portfolio;
  const set = (v: Partial<typeof l>) => patch("portfolio", v);
  return (
    <div>
      <PageTitle title="Portfolio Layout" desc="Grid columns, card sizing, cropping, titles and hover effects for the portfolio grid." />
      <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <div className="grid content-start gap-5">
          <Panel title="Display mode">
            <Segmented value={l.mode} onChange={(v) => set({ mode: v })} options={[{ value: "uniform", label: "Uniform Grid" }, { value: "flexible", label: "Flexible Preview" }]} />
            <p className="text-xs text-[#9a948c]">{l.mode === "uniform" ? "All cards share the same aspect ratio below." : "Each image uses its own aspect ratio in a balanced masonry layout."}</p>
            {l.mode === "uniform" && (
              <>
                <Select label="Card image aspect ratio" value={l.aspect} onChange={(v) => set({ aspect: v })} options={["16:9", "4:3", "3:2", "1:1", "4:5", "2:3", "1:1.414", "21:9"]} />
                <Slider label="Fixed frame height (0 = use ratio)" value={l.frameHeight} min={0} max={700} step={10} unit="px" onChange={(v) => set({ frameHeight: v })} />
              </>
            )}
            <Select
              label="Image cropping"
              value={l.crop}
              onChange={(v) => set({ crop: v })}
              options={[{ value: "perImage", label: "Use each image's own fit" }, { value: "cover", label: "Force Cover (fill & crop)" }, { value: "contain", label: "Force Contain (show whole image)" }]}
            />
          </Panel>
          <Panel title="Columns & spacing">
            <Slider label="Desktop columns" value={l.colsDesktop} min={1} max={5} onChange={(v) => set({ colsDesktop: v })} />
            <Slider label="Tablet columns" value={l.colsTablet} min={1} max={3} onChange={(v) => set({ colsTablet: v })} />
            <Slider label="Mobile columns" value={l.colsMobile} min={1} max={2} onChange={(v) => set({ colsMobile: v })} />
            <Slider label="Card spacing" value={l.gap} min={0} max={64} unit="px" onChange={(v) => set({ gap: v })} />
            <Slider label="Card border radius" value={l.radius} min={0} max={48} unit="px" onChange={(v) => set({ radius: v })} />
          </Panel>
          <Panel title="Cards">
            <Select label="Title position" value={l.titlePosition} onChange={(v) => set({ titlePosition: v })} options={[{ value: "below", label: "Below image" }, { value: "overlay", label: "Overlay on image" }, { value: "hover", label: "Overlay on hover" }]} />
            <Select label="Hover effect" value={l.hover} onChange={(v) => set({ hover: v })} options={[{ value: "zoom", label: "Zoom image" }, { value: "lift", label: "Lift card" }, { value: "tilt", label: "Subtle tilt" }, { value: "none", label: "None" }]} />
            <Slider label="Featured projects shown" value={l.featuredCount} min={1} max={12} onChange={(v) => set({ featuredCount: v })} />
            <Toggle label="Show category filters" checked={l.showFilters} onChange={(v) => set({ showFilters: v })} />
          </Panel>
        </div>
        <Panel title="Live preview" desc="Columns follow the width of your screen (desktop ≥1100px, tablet ≥720px).">
          <div
            className="rounded-2xl bg-[var(--c-light)] p-4 md:p-6"
            onClickCapture={(e) => {
              if ((e.target as HTMLElement).closest("a")) e.preventDefault();
            }}
          >
            <PortfolioGrid projects={projects.filter((p) => p.published).slice(0, 6)} categories={categories} layout={l} showFilters={l.showFilters} tone="light" />
          </div>
        </Panel>
      </div>
      <SaveBar resetKeys={["portfolio"]} />
    </div>
  );
}

export { StringList };
