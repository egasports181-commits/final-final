"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";
import { api, useToast } from "./ui";

type Key = keyof SiteSettings;

type Ctx = {
  saved: SiteSettings;
  draft: SiteSettings;
  set: <K extends Key>(key: K, value: SiteSettings[K]) => void;
  patch: <K extends Key>(key: K, value: Partial<SiteSettings[K]>) => void;
  save: () => Promise<boolean>;
  cancel: () => void;
  reset: (keys: Key[]) => void;
  dirty: boolean;
  saving: boolean;
};

const SettingsCtx = createContext<Ctx | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export function SettingsProvider({ initial, children }: { initial: SiteSettings; children: ReactNode }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const set = useCallback(<K extends Key>(key: K, value: SiteSettings[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);
  const patch = useCallback(<K extends Key>(key: K, value: Partial<SiteSettings[K]>) => {
    setDraft((d) => ({ ...d, [key]: Array.isArray(d[key]) ? value : { ...(d[key] as object), ...value } }));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      const res = await api<{ settings: SiteSettings }>("/api/admin/settings", { method: "PUT", json: { settings: draft } });
      setSaved(res.settings);
      setDraft(res.settings);
      toast("success", "Changes saved. The live website is updated.");
      return true;
    } catch (e) {
      toast("error", `Not saved: ${(e as Error).message}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [draft, toast]);

  const cancel = useCallback(() => setDraft(saved), [saved]);
  const reset = useCallback((keys: Key[]) => {
    setDraft((d) => {
      const next = { ...d };
      for (const k of keys) (next as Record<string, unknown>)[k] = structuredClone(DEFAULT_SETTINGS[k]);
      return next;
    });
  }, []);

  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);

  return (
    <SettingsCtx.Provider value={{ saved, draft, set, patch, save, cancel, reset, dirty, saving }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function SaveBar({ resetKeys, extra }: { resetKeys?: Key[]; extra?: ReactNode }) {
  const { dirty, saving, save, cancel, reset } = useSettings();
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-[#ebe6de] bg-white/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-xs ${dirty ? "font-medium text-[var(--c-primary)]" : "text-[#9a948c]"}`}>
          {dirty ? "● You have unsaved changes" : "All changes saved"}
        </span>
        <div className="flex flex-wrap gap-2">
          {extra}
          {resetKeys && (
            <button
              type="button"
              className="a-btn a-btn-ghost"
              onClick={() => window.confirm("Reset this section to the default values? (You can still Cancel before saving.)") && reset(resetKeys)}
            >
              Reset to default
            </button>
          )}
          <button type="button" className="a-btn a-btn-ghost" disabled={!dirty || saving} onClick={cancel}>
            Cancel
          </button>
          <button type="button" className="a-btn a-btn-primary" disabled={!dirty || saving} onClick={save}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
