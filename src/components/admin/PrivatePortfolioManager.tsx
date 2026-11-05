"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from "react";
import { newImage, type ProjectImage } from "@/lib/image";
import { slugify } from "@/lib/settings-defaults";
import type { PrivatePortfolio } from "@/lib/types";
import { PageTitle, Panel, TextArea, TextField, Toggle, api, confirmDelete, uploadFile, useToast } from "./ui";

type Draft = {
  id?: number;
  slug: string;
  title: string;
  description: string;
  images: ProjectImage[];
  published: boolean;
  sortOrder: number;
};

const blankDraft = (): Draft => ({
  slug: "",
  title: "",
  description: "",
  images: [],
  published: true,
  sortOrder: 0,
});

export function PrivatePortfolioManager() {
  const [portfolios, setPortfolios] = useState<PrivatePortfolio[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const toast = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ data: PrivatePortfolio[] }>("/api/admin/private-portfolios");
      setPortfolios(res.data);
    } catch (error) {
      toast("error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const edit = (portfolio: PrivatePortfolio) => {
    setDraft({
      id: portfolio.id,
      slug: portfolio.slug,
      title: portfolio.title,
      description: portfolio.description,
      images: portfolio.images,
      published: portfolio.published,
      sortOrder: portfolio.sortOrder,
    });
  };

  const uploadImages = async (selectedFiles: FileList | File[]) => {
    const files = Array.from(selectedFiles);
    if (!files.length || !draft) return;
    if (draft.images.length + files.length > 100) {
      toast("error", "A private portfolio can contain up to 100 images.");
      return;
    }

    setUploading(true);
    const uploaded: ProjectImage[] = [];
    let failed = 0;
    for (let index = 0; index < files.length; index++) {
      setUploadProgress(`Uploading ${index + 1} of ${files.length}…`);
      try {
        const result = await uploadFile(files[index]);
        uploaded.push(newImage(result.url, "16:9", result.natural));
      } catch (error) {
        failed++;
        toast("error", `${files[index].name}: ${(error as Error).message}`);
      }
    }
    setDraft((current) => current ? { ...current, images: [...current.images, ...uploaded] } : current);
    setUploading(false);
    setUploadProgress("");
    if (uploaded.length) toast("success", `${uploaded.length} image(s) uploaded. Save the portfolio to publish the changes.`);
    if (failed && !uploaded.length) toast("error", "No images could be uploaded.");
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.images.length) return;
    const images = [...draft.images];
    [images[index], images[target]] = [images[target], images[index]];
    setDraft({ ...draft, images });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.slug.trim()) return toast("error", "Choose a URL slug first.");
    if (!draft.images.length) return toast("error", "Upload at least one image first.");
    setSaving(true);
    try {
      const payload = { ...draft, slug: slugify(draft.slug) };
      const res = await api<{ data: PrivatePortfolio }>(
        draft.id ? `/api/admin/private-portfolios/${draft.id}` : "/api/admin/private-portfolios",
        { method: draft.id ? "PUT" : "POST", json: payload },
      );
      setPortfolios((current) =>
        draft.id
          ? current.map((item) => item.id === res.data.id ? res.data : item)
          : [...current, res.data].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
      );
      setDraft({
        id: res.data.id,
        slug: res.data.slug,
        title: res.data.title,
        description: res.data.description,
        images: res.data.images,
        published: res.data.published,
        sortOrder: res.data.sortOrder,
      });
      toast("success", "Private portfolio saved.");
    } catch (error) {
      toast("error", `Could not save: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (portfolio: PrivatePortfolio) => {
    if (!confirmDelete(`private portfolio “${portfolio.title || portfolio.slug}”`)) return;
    try {
      await api(`/api/admin/private-portfolios/${portfolio.id}`, { method: "DELETE" });
      setPortfolios((current) => current.filter((item) => item.id !== portfolio.id));
      if (draft?.id === portfolio.id) setDraft(null);
      toast("success", "Private portfolio deleted.");
    } catch (error) {
      toast("error", (error as Error).message);
    }
  };

  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;

  if (draft) {
    return (
      <div className="grid gap-5">
        <PageTitle
          title={draft.id ? "Edit private portfolio" : "Create private portfolio"}
          desc="Only people who know the exact URL can open this page. It is not added to the public navigation."
          actions={<button className="a-btn a-btn-ghost" onClick={() => setDraft(null)}>← Back to list</button>}
        />

        <Panel title="Page URL and heading" desc="The URL slug is the secret part of the link. The title and description are optional.">
          <TextField
            label="URL slug *"
            value={draft.slug}
            onChange={(value) => setDraft({ ...draft, slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) })}
            placeholder="e.g. documentary-thumbnails-2026"
            hint={draft.slug ? `Your page: /private/${draft.slug}` : "Use a hard-to-guess slug. Anyone with the link can access it."}
            maxLength={80}
          />
          <TextField
            label="Page heading (optional)"
            value={draft.title}
            onChange={(value) => setDraft({ ...draft, title: value, slug: draft.slug || value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) })}
            placeholder="e.g. Documentary Thumbnail Collection"
            maxLength={160}
          />
          <TextArea
            label="Page description (optional)"
            value={draft.description}
            onChange={(value) => setDraft({ ...draft, description: value })}
            placeholder="A short introduction. Leave empty if you only want to show images."
            rows={3}
            maxLength={3000}
          />
          <Toggle label="Published / link active" hint="Turn off to make this URL return 404." checked={draft.published} onChange={(value) => setDraft({ ...draft, published: value })} />
        </Panel>

        <Panel title={`Images (${draft.images.length})`} desc="Select many images at once. No title or description is required for individual images. JPG, PNG, WebP and other supported image formats up to 8 MB each.">
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!uploading) void uploadImages(event.dataTransfer.files);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d8d0c5] bg-[#fbf9f6] px-5 py-8 text-center transition hover:border-[var(--c-primary)]"
          >
            <span className="text-sm font-semibold text-[#222]">{uploading ? uploadProgress : "Choose images or drop them here"}</span>
            <span className="mt-1 text-xs text-[#8a837a]">Bulk upload · select multiple files · maximum 100 images per page</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(event) => {
                void uploadImages(event.target.files ?? []);
                event.target.value = "";
              }}
              className="sr-only"
            />
          </label>
          {draft.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {draft.images.map((image, index) => (
                <div key={image.id} className="overflow-hidden rounded-xl border border-[#ece6de] bg-white">
                  <div className="aspect-video bg-[#f0ece6]">
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between gap-1 p-2">
                    <span className="text-xs text-[#8a837a]">Image {index + 1}</span>
                    <div className="flex gap-1">
                      <button type="button" className="a-btn a-btn-ghost px-2 py-1 text-xs" disabled={index === 0} onClick={() => moveImage(index, -1)}>↑</button>
                      <button type="button" className="a-btn a-btn-ghost px-2 py-1 text-xs" disabled={index === draft.images.length - 1} onClick={() => moveImage(index, 1)}>↓</button>
                      <button type="button" className="a-btn a-btn-danger px-2 py-1 text-xs" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, i) => i !== index) })}>×</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#9a948c]">No images selected yet. Upload your first batch above.</p>
          )}
        </Panel>

        <div className="sticky bottom-0 z-30 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ebe6de] bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
          <span className="text-xs text-[#8a837a]">{draft.images.length} image(s) · ${draft.published ? "Published" : "Unpublished"}</span>
          <div className="flex gap-2">
            <button className="a-btn a-btn-ghost" disabled={saving || uploading} onClick={() => setDraft(null)}>Cancel</button>
            <button className="a-btn a-btn-primary" disabled={saving || uploading} onClick={save}>{saving ? "Saving…" : "Save private portfolio"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Private Portfolio"
        desc="Create separate unlisted portfolio links. Choose exactly which images appear on each page."
        actions={<button className="a-btn a-btn-primary" onClick={() => setDraft(blankDraft())}>+ New private page</button>}
      />
      {loading ? (
        <Panel><p className="text-sm text-[#8a837a]">Loading private portfolios…</p></Panel>
      ) : portfolios.length === 0 ? (
        <Panel><p className="text-sm text-[#8a837a]">No private pages yet. Create one and upload a batch of images.</p></Panel>
      ) : (
        <div className="grid gap-3">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="a-card flex flex-wrap items-center gap-3 p-4">
              <div className="grid h-16 w-24 shrink-0 grid-cols-2 gap-1 overflow-hidden rounded-lg bg-[#eee]">
                {portfolio.images.slice(0, 4).map((image) => <img key={image.id} src={image.url} alt="" className="h-full w-full object-cover" />)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#111]">{portfolio.title || "Untitled private page"}</div>
                <div className="mt-1 truncate text-xs text-[#8a837a]">/private/{portfolio.slug} · {portfolio.images.length} image(s)</div>
                <div className={`mt-1 text-[0.68rem] ${portfolio.published ? "text-green-700" : "text-[#9a948c]"}`}>{portfolio.published ? "Published" : "Unpublished"}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {portfolio.published && (
                  <>
                    <a className="a-btn a-btn-ghost text-xs" href={`/private/${portfolio.slug}`} target="_blank" rel="noreferrer">Open link ↗</a>
                    <button className="a-btn a-btn-ghost text-xs" onClick={() => navigator.clipboard.writeText(`${baseUrl}/private/${portfolio.slug}`).then(() => toast("success", "Private link copied.")).catch(() => toast("error", "Could not copy the link."))}>Copy link</button>
                  </>
                )}
                <button className="a-btn a-btn-dark text-xs" onClick={() => edit(portfolio)}>Edit</button>
                <button className="a-btn a-btn-danger text-xs" onClick={() => remove(portfolio)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
