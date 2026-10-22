import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, List, Minus, Plus, RotateCcw, Type, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { neighbours } from "@/lib/content";
import type { Book, Chapter, RenderedPage } from "@/lib/site";
import { useArticleClick } from "@/components/site/useArticleBehaviour";
import { HtmlArticle } from "@/components/site/HtmlArticle";
import { useMermaid } from "@/components/site/useMermaid";
import {
  saveLastRead,
  useReaderSettings,
  type ReaderFont,
  type ReaderTheme,
} from "./useReaderSettings";

const library = "/books.html";

const THEMES: { id: ReaderTheme; label: string; bg: string; fg: string }[] = [
  { id: "paper", label: "Paper", bg: "oklch(0.995 0.002 90)", fg: "oklch(0.2 0.01 70)" },
  { id: "cream", label: "Cream", bg: "oklch(0.975 0.015 85)", fg: "oklch(0.24 0.02 60)" },
  { id: "sepia", label: "Sepia", bg: "oklch(0.92 0.035 75)", fg: "oklch(0.3 0.04 55)" },
  { id: "dusk", label: "Dusk", bg: "oklch(0.27 0.015 60)", fg: "oklch(0.88 0.025 80)" },
  { id: "night", label: "Night", bg: "oklch(0.14 0.005 260)", fg: "oklch(0.8 0.008 80)" },
];
const FONTS: { id: ReaderFont; label: string; family: string }[] = [
  { id: "serif", label: "Newsreader", family: "var(--font-serif)" },
  { id: "literata", label: "Literata", family: "'Literata Variable', serif" },
  { id: "sans", label: "Geist", family: "var(--font-sans)" },
  { id: "mono", label: "Mono", family: "var(--font-mono)" },
];

export function Reader({
  book,
  chapter,
  page,
}: {
  book: Book;
  chapter: Chapter;
  page: RenderedPage;
}) {
  const { settings, update, reset } = useReaderSettings();
  const [panel, setPanel] = useState<"none" | "type" | "toc">("none");
  const [hidden, setHidden] = useState(false);
  const [progress, setProgress] = useState(0);
  const lastY = useRef(0);
  const onClick = useArticleClick();
  const navigate = useNavigate();
  const articleRef = useRef<HTMLElement>(null);
  useMermaid(articleRef, [page.html, settings.theme]);
  const { prev, next } = neighbours(book.chapters, chapter);

  useEffect(() => saveLastRead(book.id, chapter.key), [book.id, chapter.key]);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, y / max) : 0);
        if (Math.abs(y - lastY.current) > 8) {
          setHidden(y > lastY.current && y > 120);
          lastY.current = y;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [chapter.key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea")) return;
      if (e.key === "Escape") setPanel("none");
      if (e.key === "ArrowRight" && next) navigate({ to: next.url });
      if (e.key === "ArrowLeft" && prev) navigate({ to: prev.url });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, prev, next, navigate]);

  const remaining = Math.max(1, Math.round(chapter.minutes * (1 - progress)));
  const showBar = !hidden || panel !== "none";

  return (
    <div
      className={`reader ${settings.justify ? "reader-justify" : ""}`}
      data-theme={settings.theme}
      data-font={settings.font}
      style={{
        ["--r-size" as string]: `${settings.size}px`,
        ["--r-leading" as string]: settings.leading,
        ["--r-width" as string]: `${settings.width}rem`,
      }}
    >
      {/* progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-0.5">
        <div
          className="h-full origin-left transition-transform duration-150"
          style={{ transform: `scaleX(${progress})`, background: "var(--r-accent)" }}
        />
      </div>

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-transform duration-300 ${showBar ? "translate-y-0" : "-translate-y-full"}`}
        style={{
          background: "color-mix(in oklab, var(--r-bg) 88%, transparent)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--r-rule)",
        }}
      >
        <div
          className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-3 sm:px-5"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <Link
            to={library}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm opacity-70 transition-opacity hover:opacity-100"
            aria-label="Back to library"
          >
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Library</span>
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[13px]" style={{ color: "var(--r-muted)" }}>
              <span className="hidden sm:inline">{book.title} · </span>
              {chapter.number ? `Chapter ${chapter.number}` : chapter.title}
            </p>
          </div>
          <span className="hidden text-xs sm:inline" style={{ color: "var(--r-muted)" }}>
            {remaining} min left
          </span>
          <button
            onClick={() => setPanel(panel === "toc" ? "none" : "toc")}
            className="grid size-9 place-items-center rounded-md opacity-75 hover:opacity-100"
            aria-label="Contents"
          >
            <List className="size-[18px]" />
          </button>
          <button
            onClick={() => setPanel(panel === "type" ? "none" : "type")}
            className="grid size-9 place-items-center rounded-md opacity-75 hover:opacity-100"
            aria-label="Reading settings"
          >
            <Type className="size-[18px]" />
          </button>
        </div>
      </header>

      {panel !== "none" && <div className="fixed inset-0 z-40" onClick={() => setPanel("none")} />}

      {panel === "type" && (
        <div
          className="fixed right-3 top-14 z-50 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-200"
          style={{
            background: "var(--r-bg)",
            border: "1px solid var(--r-rule)",
            fontFamily: "var(--font-sans)",
          }}
          role="dialog"
          aria-label="Reading settings"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium">Reading settings</p>
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>
          <Label>Theme</Label>
          <div className="mb-5 grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ theme: t.id })}
                className="flex flex-col items-center gap-1 text-[11px]"
                aria-pressed={settings.theme === t.id}
              >
                <span
                  className="grid size-10 place-items-center rounded-full font-serif text-sm transition-transform hover:scale-105"
                  style={{
                    background: t.bg,
                    color: t.fg,
                    boxShadow:
                      settings.theme === t.id
                        ? "0 0 0 2px var(--r-bg), 0 0 0 4px var(--r-accent)"
                        : "inset 0 0 0 1px var(--r-rule)",
                  }}
                >
                  Aa
                </span>
                <span style={{ color: "var(--r-muted)" }}>{t.label}</span>
              </button>
            ))}
          </div>
          <Label>Typeface</Label>
          <div className="mb-5 grid grid-cols-2 gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => update({ font: f.id })}
                className="rounded-lg px-3 py-2 text-left text-[15px] transition-colors"
                style={{
                  fontFamily: f.family,
                  background: settings.font === f.id ? "var(--r-soft)" : "transparent",
                  border: `1px solid ${settings.font === f.id ? "var(--r-accent)" : "var(--r-rule)"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Stepper
            label="Text size"
            value={`${settings.size}px`}
            onMinus={() => update({ size: settings.size - 1 })}
            onPlus={() => update({ size: settings.size + 1 })}
          />
          <Stepper
            label="Line spacing"
            value={settings.leading.toFixed(2)}
            onMinus={() => update({ leading: +(settings.leading - 0.1).toFixed(2) })}
            onPlus={() => update({ leading: +(settings.leading + 0.1).toFixed(2) })}
          />
          <Stepper
            label="Page width"
            value={`${settings.width}`}
            onMinus={() => update({ width: settings.width - 2 })}
            onPlus={() => update({ width: settings.width + 2 })}
          />
          <label className="mt-3 flex cursor-pointer items-center justify-between text-sm">
            Justify text
            <input
              type="checkbox"
              checked={settings.justify}
              onChange={(e) => update({ justify: e.target.checked })}
              className="size-4"
              style={{ accentColor: "var(--r-accent)" }}
            />
          </label>
        </div>
      )}

      {panel === "toc" && (
        <div
          className="fixed inset-y-0 right-0 z-50 w-[min(24rem,90vw)] overflow-y-auto p-6 shadow-2xl animate-in slide-in-from-right duration-250"
          style={{ background: "var(--r-bg)", borderLeft: "1px solid var(--r-rule)" }}
          role="dialog"
          aria-label="Contents"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p
                className="text-xs uppercase tracking-[0.16em]"
                style={{ color: "var(--r-muted)", fontFamily: "var(--font-sans)" }}
              >
                {book.volume}
              </p>
              <p className="mt-1 font-display text-2xl leading-tight">{book.title}</p>
            </div>
            <button
              onClick={() => setPanel("none")}
              className="opacity-60 hover:opacity-100"
              aria-label="Close contents"
            >
              <X className="size-5" />
            </button>
          </div>
          <ol className="space-y-0.5" style={{ fontFamily: "var(--r-font)" }}>
            {book.chapters.map((c) => {
              const cur = c.key === chapter.key;
              return (
                <li key={c.key}>
                  <Link
                    to={c.url}
                    onClick={() => setPanel("none")}
                    className="flex gap-3 rounded-lg px-3 py-2 transition-colors"
                    style={{
                      background: cur ? "var(--r-soft)" : undefined,
                      color: cur ? "var(--r-accent)" : undefined,
                    }}
                  >
                    <span
                      className="w-5 shrink-0 text-right tabular-nums"
                      style={{ color: "var(--r-muted)" }}
                    >
                      {c.number ?? "·"}
                    </span>
                    <span className="leading-snug">{c.title}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <main key={chapter.key} className="px-5 pb-24 pt-24 sm:px-8 sm:pt-32">
        <div className="prose-book mb-10 animate-rise" style={{ fontFamily: "var(--font-sans)" }}>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: "var(--r-muted)" }}>
            {chapter.number ? `Chapter ${chapter.number}` : book.volume} · {chapter.minutes} min
          </p>
        </div>
        <HtmlArticle
          ref={articleRef}
          className="prose-book animate-rise"
          onClick={onClick}
          html={page.html}
        />

        <nav
          className="prose-book mt-20 pt-10"
          style={{ borderTop: "1px solid var(--r-rule)" }}
          aria-label="Chapter navigation"
        >
          {next ? (
            <Link
              to={next.url}
              className="group block !no-underline"
              style={{ color: "var(--r-fg)" }}
            >
              <span
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: "var(--r-muted)", fontFamily: "var(--font-sans)" }}
              >
                Next {next.number ? `· Chapter ${next.number}` : ""}
              </span>
              <span className="mt-2 flex items-center justify-between gap-4 font-display text-[1.9em] leading-tight">
                {next.title}
                <ArrowRight
                  className="size-6 shrink-0 transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--r-accent)" }}
                />
              </span>
            </Link>
          ) : (
            <p className="text-center italic" style={{ color: "var(--r-muted)" }}>
              The end of {book.title}.
            </p>
          )}
          {prev && (
            <Link
              to={prev.url}
              className="mt-8 inline-flex items-center gap-1.5 text-sm !no-underline opacity-60 hover:opacity-100"
              style={{ color: "var(--r-fg)", fontFamily: "var(--font-sans)" }}
            >
              <ArrowLeft className="size-3.5" /> {prev.title}
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--r-muted)" }}>
      {children}
    </p>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span>{label}</span>
      <div
        className="flex items-center gap-1 rounded-full p-0.5"
        style={{ border: "1px solid var(--r-rule)" }}
      >
        <button
          onClick={onMinus}
          className="grid size-7 place-items-center rounded-full hover:opacity-70"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-12 text-center text-xs tabular-nums">{value}</span>
        <button
          onClick={onPlus}
          className="grid size-7 place-items-center rounded-full hover:opacity-70"
          aria-label={`Increase ${label}`}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ReaderSkeleton() {
  return (
    <div className="reader min-h-screen px-5 pt-32">
      <div className="mx-auto max-w-[38rem] space-y-5 opacity-40">
        <div className="h-12 w-3/4 animate-pulse rounded" style={{ background: "var(--r-rule)" }} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded"
            style={{ background: "var(--r-rule)", width: `${95 - i * 5}%` }}
          />
        ))}
      </div>
    </div>
  );
}
