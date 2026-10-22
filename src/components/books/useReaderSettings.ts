import { useCallback, useEffect, useState } from "react";

export type ReaderTheme = "cream" | "paper" | "sepia" | "dusk" | "night";
export type ReaderFont = "serif" | "literata" | "sans" | "mono";
export type ReaderSettings = {
  theme: ReaderTheme;
  font: ReaderFont;
  size: number; // px
  leading: number;
  width: number; // rem
  justify: boolean;
};

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "cream",
  font: "serif",
  size: 20,
  leading: 1.7,
  width: 38,
  justify: false,
};

export const SIZE_RANGE = [15, 28] as const;
export const WIDTH_RANGE = [30, 50] as const;

const KEY = "syg-reader";

export function clampSettings(s: Partial<ReaderSettings>): ReaderSettings {
  const m = { ...DEFAULT_SETTINGS, ...s };
  return {
    ...m,
    size: Math.min(SIZE_RANGE[1], Math.max(SIZE_RANGE[0], m.size)),
    width: Math.min(WIDTH_RANGE[1], Math.max(WIDTH_RANGE[0], m.width)),
    leading: Math.min(2.1, Math.max(1.4, m.leading)),
  };
}

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSettings(clampSettings(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, []);
  const update = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((s) => {
      const n = clampSettings({ ...s, ...patch });
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* ignore */
      }
      return n;
    });
  }, []);
  const reset = useCallback(() => update(DEFAULT_SETTINGS), [update]);
  return { settings, update, reset };
}

const LAST = "syg-last-read";
export function saveLastRead(book: string, chapter: string) {
  try {
    const all = JSON.parse(localStorage.getItem(LAST) ?? "{}");
    all[book] = chapter;
    all.__latest = book;
    localStorage.setItem(LAST, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}
export function readLastRead(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST) ?? "{}");
  } catch {
    return {};
  }
}
