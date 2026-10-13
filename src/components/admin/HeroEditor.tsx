"use client";

import { useEffect, useRef, useState } from "react";
import type { DeviceImage } from "@/lib/settings-defaults";
import { Hero } from "@/components/site/Hero";
import { Header } from "@/components/site/Header";
import { SaveBar, useSettings } from "./settings-context";
import { ColorField, ImageInput, PageTitle, Panel, Segmented, Slider, StringList, TextArea, TextField, Toggle } from "./ui";

type Device = "desktop" | "tablet" | "mobile";
const DEVICE_SIZE: Record<Device, { w: number; h: number }> = {
  desktop: { w: 1440, h: 900 },
  tablet: { w: 820, h: 1180 },
  mobile: { w: 390, h: 844 },
};

function ScaledPreview({ device, children }: { device: Device; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(400);
  const size = DEVICE_SIZE[device];

  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const update = () => {
      const s = Math.min(1, o.clientWidth / size.w);
      setScale(s);
      setHeight(i.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [size.w]);

  return (
    <div ref={outer} className="w-full">
      <div className="mx-auto overflow-hidden rounded-xl shadow-xl ring-1 ring-black/10" style={{ width: size.w * scale, height }}>
        <div ref={inner} style={{ width: size.w, transform: `scale(${scale})`, transformOrigin: "top left" }} className="relative bg-[var(--c-dark)]">
          {children}
        </div>
      </div>
      <p className="mt-2 text-center text-[0.7rem] text-[#9a948c]">
        {device} preview · {size.w}px wide · scaled {Math.round(scale * 100)}%
      </p>
    </div>
  );
}

export function HeroEditor() {
  const { draft, patch } = useSettings();
  const h = draft.hero;
  const [device, setDevice] = useState<Device>("desktop");
  const [tab, setTab] = useState<"content" | "image" | "background" | "extras">("image");
  const set = (v: Partial<typeof h>) => patch("hero", v);
  const dev = h[device];
  const setDev = (v: Partial<DeviceImage>) => set({ [device]: { ...dev, ...v } } as Partial<typeof h>);

  return (
    <div>
      <PageTitle
        title="Hero Editor"
        desc="Everything in the first screen of your website. Changes preview instantly here and go live when you click Save Changes."
        actions={<a href="/" target="_blank" rel="noreferrer" className="a-btn a-btn-ghost">Preview live site ↗</a>}
      />
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <div className="grid content-start gap-4">
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: "image", label: "Image" },
              { value: "content", label: "Text" },
              { value: "background", label: "Background" },
              { value: "extras", label: "Cards" },
            ]}
          />
          {tab === "image" && (
            <>
              <Panel title="Hero image">
                <ImageInput label="Image" value={h.imageUrl} onChange={(v) => set({ imageUrl: v })} hint="Tip: a subject on a plain orange background blends best." />
                <Segmented label="Image fit" value={h.fit} onChange={(v) => set({ fit: v })} options={[{ value: "cover", label: "Cover" }, { value: "contain", label: "Contain" }]} />
                <Toggle label="Soft edge fade" hint="Blend image edges into the gradient" checked={h.imageFade} onChange={(v) => set({ imageFade: v })} />
                <Segmented
                  label="Background word layering"
                  value={h.layer}
                  onChange={(v) => set({ layer: v })}
                  options={[{ value: "behind", label: "Behind image" }, { value: "front", label: "In front" }, { value: "blend", label: "Blend" }]}
                />
              </Panel>
              <Panel title={`Size & position — ${device}`} desc="Each device has independent settings. Switch device above the preview.">
                <Segmented value={device} onChange={setDevice} options={[{ value: "desktop", label: "Desktop" }, { value: "tablet", label: "Tablet" }, { value: "mobile", label: "Mobile" }]} />
                <Slider label="Width" value={dev.width} min={device === "desktop" ? 20 : device === "tablet" ? 30 : 40} max={device === "desktop" ? 90 : 100} unit="%" onChange={(v) => setDev({ width: v })} />
                <Slider label="Height" value={dev.height} min={device === "desktop" ? 30 : 25} max={device === "desktop" ? 110 : 100} unit="%" onChange={(v) => setDev({ height: v })} />
                <Slider label="Scale / zoom" value={dev.scale} min={0.5} max={2.5} step={0.05} unit="×" onChange={(v) => setDev({ scale: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Slider label="Focal X" value={dev.posX} min={0} max={100} unit="%" onChange={(v) => setDev({ posX: v })} />
                  <Slider label="Focal Y" value={dev.posY} min={0} max={100} unit="%" onChange={(v) => setDev({ posY: v })} />
                  <Slider label="Move horizontal" value={dev.offsetX} min={-40} max={40} unit="%" onChange={(v) => setDev({ offsetX: v })} />
                  <Slider label="Move vertical" value={dev.offsetY} min={-40} max={40} unit="%" onChange={(v) => setDev({ offsetY: v })} />
                </div>
                <button type="button" className="a-btn a-btn-ghost" onClick={() => setDev({ scale: 1, posX: 50, posY: 30, offsetX: 0, offsetY: 0 })}>↺ Reset position for {device}</button>
              </Panel>
            </>
          )}
          {tab === "content" && (
            <Panel title="Text & buttons">
              <TextArea label="Intro headline (left)" rows={2} value={h.introHeadline} onChange={(v) => set({ introHeadline: v })} maxLength={140} />
              <TextArea label="Intro description" value={h.introText} onChange={(v) => set({ introText: v })} maxLength={300} />
              <div className="grid grid-cols-3 gap-2">
                <TextField label="Headline 1" value={h.headline1} onChange={(v) => set({ headline1: v })} maxLength={20} />
                <TextField label="Headline 2" value={h.headline2} onChange={(v) => set({ headline2: v })} maxLength={20} />
                <TextField label="Headline 3" value={h.headline3} onChange={(v) => set({ headline3: v })} maxLength={20} />
              </div>
              <TextArea label="Description (right)" value={h.sideText} onChange={(v) => set({ sideText: v })} maxLength={300} />
              <TextField label="Large background word" value={h.bgWord} onChange={(v) => set({ bgWord: v })} maxLength={12} hint="Short words (≤ 8 letters) look best." />
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Main button label" value={h.primaryLabel} onChange={(v) => set({ primaryLabel: v })} maxLength={30} />
                <TextField label="Main button link" value={h.primaryHref} onChange={(v) => set({ primaryHref: v })} />
                <TextField label="Second button label" value={h.secondaryLabel} onChange={(v) => set({ secondaryLabel: v })} maxLength={30} />
                <TextField label="Second button link" value={h.secondaryHref} onChange={(v) => set({ secondaryHref: v })} />
              </div>
            </Panel>
          )}
          {tab === "background" && (
            <Panel title="Gradient & spacing">
              <div className="h-16 rounded-xl" style={{ background: `linear-gradient(${h.gradAngle}deg, ${h.gradFrom}, ${h.gradVia} 50%, ${h.gradTo})` }} />
              <div className="grid grid-cols-3 gap-2">
                <ColorField label="From" value={h.gradFrom} onChange={(v) => set({ gradFrom: v })} />
                <ColorField label="Middle" value={h.gradVia} onChange={(v) => set({ gradVia: v })} />
                <ColorField label="To" value={h.gradTo} onChange={(v) => set({ gradTo: v })} />
              </div>
              <Slider label="Gradient angle" value={h.gradAngle} min={0} max={360} unit="°" onChange={(v) => set({ gradAngle: v })} />
              <Slider label="Minimum height" value={h.minHeight} min={60} max={130} unit="vh" onChange={(v) => set({ minHeight: v })} />
              <Slider label="Top spacing" value={h.paddingTop} min={60} max={260} unit="px" onChange={(v) => set({ paddingTop: v })} />
              <Slider label="Bottom spacing" value={h.paddingBottom} min={0} max={200} unit="px" onChange={(v) => set({ paddingBottom: v })} />
            </Panel>
          )}
          {tab === "extras" && (
            <>
              <Panel title="Statistic cards">
                <Toggle label="Show statistic cards" checked={h.showStats} onChange={(v) => set({ showStats: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <TextField label="Card 1 value" value={h.stat1Value} onChange={(v) => set({ stat1Value: v })} maxLength={10} />
                  <TextField label="Card 1 label" value={h.stat1Label} onChange={(v) => set({ stat1Label: v })} maxLength={40} />
                  <TextField label="Card 2 value" value={h.stat2Value} onChange={(v) => set({ stat2Value: v })} maxLength={10} />
                  <TextField label="Card 2 label" value={h.stat2Label} onChange={(v) => set({ stat2Label: v })} maxLength={40} />
                </div>
                <TextField label="Card 2 title" value={h.stat2Title} onChange={(v) => set({ stat2Title: v })} maxLength={50} />
              </Panel>
              <Panel title="Floating card">
                <Toggle label="Show floating card" checked={h.showCard} onChange={(v) => set({ showCard: v })} />
                <TextField label="Title" value={h.cardTitle} onChange={(v) => set({ cardTitle: v })} maxLength={60} />
                <TextArea label="Text" value={h.cardText} onChange={(v) => set({ cardText: v })} maxLength={160} />
                <TextField label="Badge" value={h.cardBadge} onChange={(v) => set({ cardBadge: v })} maxLength={30} />
              </Panel>
              <Panel title="Dark strip below hero">
                <TextField label="Strip title" value={h.stripTitle} onChange={(v) => set({ stripTitle: v })} />
                <StringList label="Scrolling items" values={h.stripItems} onChange={(v) => set({ stripItems: v })} />
                <StringList label="Tag pills" values={h.stripTags} onChange={(v) => set({ stripTags: v })} />
              </Panel>
            </>
          )}
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="mb-3 flex justify-center">
            <Segmented value={device} onChange={setDevice} options={[{ value: "desktop", label: "🖥 Desktop" }, { value: "tablet", label: "▭ Tablet" }, { value: "mobile", label: "▯ Mobile" }]} />
          </div>
          <div className="max-h-[78vh] overflow-y-auto rounded-2xl bg-[#ece7df] p-3 md:p-5">
            <ScaledPreview device={device}>
              <Header settings={draft} preview />
              <Hero settings={draft} previewHeight={DEVICE_SIZE[device].h} />
            </ScaledPreview>
          </div>
        </div>
      </div>
      <SaveBar resetKeys={["hero"]} />
    </div>
  );
}
