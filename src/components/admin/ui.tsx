"use client";

/* eslint-disable @next/next/no-img-element */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ---------------- API helper ---------------- */
export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init || {};
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      cache: "no-store",
    });
  } catch {
    throw new Error("Network error — is the server running?");
  }
  const data = (await res.json().catch(() => null)) as (T & { ok?: boolean; error?: string }) | null;
  if (!res.ok || !data || data.ok === false) {
    if (res.status === 401) throw new Error("Your session expired. Please reload and log in again.");
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function readImageSize(url: string): Promise<{ w: number; h: number } | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve(undefined);
    img.src = url;
  });
}

export async function uploadFile(file: File): Promise<{ url: string; id: number; natural?: { w: number; h: number } }> {
  const fd = new FormData();
  fd.append("file", file);
  const data = await api<{ url: string; id: number }>("/api/admin/upload", { method: "POST", body: fd });
  const natural = await readImageSize(data.url);
  return { ...data, natural };
}

/* ---------------- Toasts ---------------- */
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.kind === "error" ? "alert" : "status"}
            className={`rounded-xl px-4 py-3 text-sm shadow-lg anim-rise ${
              t.kind === "success" ? "bg-[#0f5132] text-white" : t.kind === "error" ? "bg-[#9b1c1c] text-white" : "bg-[#111] text-white"
            }`}
          >
            {t.kind === "success" ? "✓ " : t.kind === "error" ? "⚠ " : ""}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Layout primitives ---------------- */
export function Panel({ title, desc, children, actions }: { title?: string; desc?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="a-card p-5 md:p-6">
      {(title || actions) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-[0.95rem] font-semibold text-[#111]">{title}</h3>}
            {desc && <p className="mt-1 text-xs text-[#7a746c]">{desc}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

export function PageTitle({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="f-heading text-2xl font-semibold tracking-tight text-[#111] md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-sm text-[#7a746c]">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/* ---------------- Fields ---------------- */
export function TextField({ label, value, onChange, placeholder, type = "text", hint, maxLength = 500 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; hint?: string; maxLength?: number }) {
  return (
    <label className="block">
      <span className="a-label">{label}</span>
      <input type={type} className="a-input" value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="mt-1 block text-[0.7rem] text-[#9a948c]">{hint}</span>}
    </label>
  );
}

export function TextArea({ label, value, onChange, rows = 3, placeholder, maxLength = 3000 }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string; maxLength?: number }) {
  return (
    <label className="block">
      <span className="a-label">{label}</span>
      <textarea className="a-input resize-y" rows={rows} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export function Slider({ label, value, onChange, min, max, step = 1, unit = "" }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string }) {
  return (
    <label className="block">
      <span className="a-label flex items-center justify-between">
        <span>{label}</span>
        <span className="flex items-center gap-1 normal-case tracking-normal">
          <input
            type="number"
            className="w-16 rounded-md border border-[#e3ded6] px-1.5 py-0.5 text-right text-xs text-[#111]"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
            }}
          />
          <span className="text-[#9a948c]">{unit}</span>
        </span>
      </span>
      <input type="range" className="a-range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

export function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] | readonly T[] }) {
  const opts = (options as (T | { value: T; label: string })[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <label className="block">
      <span className="a-label">{label}</span>
      <select className="a-input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({ label, value, onChange, options }: { label?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      {label && <span className="a-label">{label}</span>}
      <div className="flex flex-wrap gap-1 rounded-xl bg-[#f3efe9] p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${value === o.value ? "bg-white text-[#111] shadow-sm" : "text-[#7a746c] hover:text-[#111]"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm text-[#222]">{label}</span>
        {hint && <span className="block text-xs text-[#9a948c]">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[var(--c-primary)]" : "bg-[#d9d3ca]"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="a-label">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border border-[#e3ded6] bg-white p-1" />
        <input
          className="a-input font-mono"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
        />
      </span>
    </label>
  );
}

export function StringList({ label, values, onChange, placeholder = "Add item…" }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <span className="a-label">{label}</span>
      <div className="grid gap-1.5">
        {values.map((v, i) => (
          <div key={i} className="flex gap-1.5">
            <input className="a-input" value={v} onChange={(e) => onChange(values.map((x, k) => (k === i ? e.target.value : x)))} />
            <button type="button" className="a-btn a-btn-ghost px-2" disabled={i === 0} onClick={() => onChange(arrayMove(values, i, i - 1))} aria-label="Move up">↑</button>
            <button type="button" className="a-btn a-btn-danger px-2.5" onClick={() => onChange(values.filter((_, k) => k !== i))} aria-label="Remove">✕</button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input
            className="a-input"
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="a-btn a-btn-ghost" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Drop zone / image input ---------------- */
export function DropZone({ onFiles, multiple, label = "Drag & drop images here, or click to browse", compact }: { onFiles: (files: File[]) => void | Promise<void>; multiple?: boolean; label?: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const handle = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    setBusy(true);
    try {
      await onFiles(multiple ? files : [files[0]]);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-center transition ${
        compact ? "px-3 py-4" : "px-4 py-8"
      } ${over ? "border-[var(--c-primary)] bg-[#fff1ea]" : "border-[#ddd6cc] bg-[#faf8f5] hover:border-[#bbb]"}`}
    >
      <span className="text-xl">{busy ? "⏳" : "⬆"}</span>
      <span className="text-xs font-medium text-[#444]">{busy ? "Uploading…" : label}</span>
      <span className="text-[0.68rem] text-[#9a948c]">JPG, PNG, WebP, GIF, SVG · max 8 MB</span>
      <input ref={input} type="file" accept="image/*" multiple={multiple} hidden onChange={(e) => handle(e.target.files)} />
    </div>
  );
}

export function ImageInput({ label, value, onChange, hint, previewClass = "h-28" }: { label: string; value: string; onChange: (url: string) => void; hint?: string; previewClass?: string }) {
  const toast = useToast();
  return (
    <div>
      <span className="a-label">{label}</span>
      <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-start">
        {value ? (
          <div className={`relative overflow-hidden rounded-xl border border-[#ebe6de] bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:16px_16px] ${previewClass} aspect-square sm:aspect-auto sm:w-40`}>
            <img src={value} alt="" className="h-full w-full object-contain" />
          </div>
        ) : null}
        <div className="grid gap-2">
          <DropZone
            compact
            onFiles={async ([f]) => {
              try {
                const r = await uploadFile(f);
                onChange(r.url);
                toast("success", "Image uploaded. Remember to save changes.");
              } catch (e) {
                toast("error", (e as Error).message);
              }
            }}
          />
          <div className="flex gap-2">
            <input className="a-input" value={value} placeholder="…or paste an image URL" onChange={(e) => onChange(e.target.value)} />
            {value && <button type="button" className="a-btn a-btn-danger" onClick={() => onChange("")}>Remove</button>}
          </div>
          {hint && <span className="text-[0.7rem] text-[#9a948c]">{hint}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Sortable list (dnd-kit + accessible buttons) ---------------- */
type Controls = { handle: ReactNode; moveUp: () => void; moveDown: () => void; index: number; isFirst: boolean; isLast: boolean };

function SortableRow({ id, children }: { id: string | number; children: (handle: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="grid h-8 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-[#9a948c] hover:bg-[#f3efe9] active:cursor-grabbing"
      aria-label="Drag to reorder"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        {[6, 12, 18].flatMap((y) => [9, 15].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.8" />))}
      </svg>
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 20 : undefined, position: "relative", opacity: isDragging ? 0.85 : 1 }}
    >
      {children(handle)}
    </div>
  );
}

export function SortableList<T>({
  items,
  getId,
  onReorder,
  render,
  grid,
  className = "grid gap-2",
}: {
  items: T[];
  getId: (t: T) => string | number;
  onReorder: (next: T[]) => void;
  render: (item: T, c: Controls) => ReactNode;
  grid?: boolean;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = items.map(getId);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id);
    const to = ids.indexOf(over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={getId(item)} id={getId(item)}>
              {(handle) =>
                render(item, {
                  handle,
                  index,
                  isFirst: index === 0,
                  isLast: index === items.length - 1,
                  moveUp: () => index > 0 && onReorder(arrayMove(items, index, index - 1)),
                  moveDown: () => index < items.length - 1 && onReorder(arrayMove(items, index, index + 1)),
                })
              }
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function MoveButtons({ c }: { c: Controls }) {
  return (
    <span className="flex shrink-0 gap-1">
      <button type="button" className="a-btn a-btn-ghost px-2 py-1" disabled={c.isFirst} onClick={c.moveUp} aria-label="Move up">↑</button>
      <button type="button" className="a-btn a-btn-ghost px-2 py-1" disabled={c.isLast} onClick={c.moveDown} aria-label="Move down">↓</button>
    </span>
  );
}

export function confirmDelete(what: string) {
  return window.confirm(`Delete ${what}? This cannot be undone.`);
}
