"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import {
  ASPECT_PRESETS,
  DEFAULT_DISPLAY,
  aspectRatioOf,
  frameStyle,
  imgStyle,
  type ImageDisplay,
  type ProjectImage,
} from "@/lib/image";
import { ColorField, Segmented, Slider, TextField, Toggle } from "./ui";

type Props = {
  image: ProjectImage;
  onChange: (img: ProjectImage) => void;
  gridAspect: string;
  gridRadius: number;
  defaultAspect?: string;
};

export function ImageEditor({ image, onChange, gridAspect, gridRadius, defaultAspect = "16:9" }: Props) {
  const d = image.display;
  const [view, setView] = useState<"own" | "grid">("own");
  const frameRef = useRef<HTMLDivElement>(null);
  const set = (p: Partial<ImageDisplay>) => onChange({ ...image, display: { ...d, ...p } });

  const setFocal = (clientX: number, clientY: number) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100)));
    set({ posX: x, posY: y });
  };

  const preview =
    view === "own"
      ? frameStyle(image, { defaultRadius: gridRadius })
      : { ...frameStyle(image, { forceAspect: gridAspect, defaultRadius: gridRadius, ignoreHeight: true }), width: "100%" };
  // Keep the preview reasonably sized when a fixed px height is used.
  if (view === "own" && d.height > 0) preview.height = Math.min(d.height, 420);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: "own", label: "Image settings" },
              { value: "grid", label: `Uniform grid (${gridAspect})` },
            ]}
          />
        </div>
        <div className="rounded-2xl bg-[#1a1a1a] p-4 md:p-6">
          <div
            ref={frameRef}
            style={preview}
            className="cursor-crosshair select-none"
            onClick={(e) => setFocal(e.clientX, e.clientY)}
            title="Click to set the focal point"
          >
            <img
              src={image.url}
              alt=""
              draggable={false}
              style={imgStyle(d)}
              onLoad={(e) => {
                const t = e.currentTarget;
                if (!image.naturalW && t.naturalWidth) onChange({ ...image, naturalW: t.naturalWidth, naturalH: t.naturalHeight });
              }}
            />
            <span
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,.4)]"
              style={{ left: `${d.posX}%`, top: `${d.posY}%` }}
            >
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--c-bright)]" />
            </span>
          </div>
        </div>
        <p className="mt-2 text-[0.7rem] text-[#9a948c]">
          Click the preview to set the focal point. The original file is never modified — only display settings are stored.
          {image.naturalW ? ` Original: ${image.naturalW}×${image.naturalH}px.` : ""}
        </p>
      </div>

      <div className="grid content-start gap-4">
        <div>
          <span className="a-label">Aspect ratio / crop</span>
          <div className="flex flex-wrap gap-1.5">
            {ASPECT_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                title={p.hint}
                onClick={() => set({ aspect: p.value })}
                className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                  d.aspect === p.value ? "border-[var(--c-primary)] bg-[#fff1ea] text-[var(--c-primary)]" : "border-[#e3ded6] hover:border-[#bbb]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[0.7rem] text-[#9a948c]">
            {ASPECT_PRESETS.find((p) => p.value === d.aspect)?.hint} · ratio {aspectRatioOf(d.aspect, d, { w: image.naturalW, h: image.naturalH })}
          </p>
        </div>
        {d.aspect === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <Slider label="Ratio width" value={d.customW} min={1} max={32} onChange={(v) => set({ customW: v })} />
            <Slider label="Ratio height" value={d.customH} min={1} max={32} onChange={(v) => set({ customH: v })} />
          </div>
        )}
        <Segmented
          label="Object fit"
          value={d.fit}
          onChange={(v) => set({ fit: v })}
          options={[
            { value: "cover", label: "Cover (crop)" },
            { value: "contain", label: "Contain (full)" },
            { value: "fill", label: "Stretch" },
          ]}
        />
        <Slider label="Zoom / scale" value={d.scale} min={0.5} max={3} step={0.05} unit="×" onChange={(v) => set({ scale: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Horizontal position" value={d.posX} min={0} max={100} unit="%" onChange={(v) => set({ posX: v })} />
          <Slider label="Vertical position" value={d.posY} min={0} max={100} unit="%" onChange={(v) => set({ posY: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Slider label="Display width" value={d.width} min={40} max={100} unit="%" onChange={(v) => set({ width: v })} />
          <Slider label="Fixed height (0 = auto)" value={d.height} min={0} max={1200} step={10} unit="px" onChange={(v) => set({ height: v })} />
        </div>
        <div className="grid grid-cols-2 items-end gap-3">
          <div>
            <Toggle label="Custom radius" checked={d.radius >= 0} onChange={(on) => set({ radius: on ? gridRadius : -1 })} />
            {d.radius >= 0 && <Slider label="Border radius" value={d.radius} min={0} max={64} unit="px" onChange={(v) => set({ radius: v })} />}
          </div>
          <ColorField label="Background (contain)" value={d.bg} onChange={(v) => set({ bg: v })} />
        </div>
        <TextField label="Alt text / caption" value={image.alt} onChange={(v) => onChange({ ...image, alt: v })} placeholder="Describe the image" />
        <div>
          <button
            type="button"
            className="a-btn a-btn-ghost"
            onClick={() => onChange({ ...image, display: { ...DEFAULT_DISPLAY, aspect: defaultAspect } })}
          >
            ↺ Reset image to default
          </button>
        </div>
      </div>
    </div>
  );
}
