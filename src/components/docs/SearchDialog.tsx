import { useNavigate } from "@tanstack/react-router";
import { FileText, Hash, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry as Entry } from "@/lib/site";

let cache: Promise<Entry[]> | null = null;
const loadIndex = () =>
  (cache ??= import("@/generated/search.json").then((m) => m.default as Entry[]));

function score(e: Entry, terms: string[]) {
  const t = e.t.toLowerCase();
  const x = e.x.toLowerCase();
  let s = 0;
  for (const term of terms) {
    if (t.includes(term)) s += t.startsWith(term) ? 12 : 8;
    else if (x.includes(term)) s += 2;
    else return 0;
  }
  return s - e.t.length / 200;
}

function snippet(x: string, term: string) {
  const i = x.toLowerCase().indexOf(term);
  if (i < 0) return x.slice(0, 120);
  const start = Math.max(0, i - 40);
  return (start ? "…" : "") + x.slice(start, start + 130);
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [index, setIndex] = useState<Entry[]>([]);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setIndex);
    setQ("");
    setActive(0);
    requestAnimationFrame(() => input.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return index.filter((e) => !e.t.includes(" · ")).slice(0, 8);
    return index
      .map((e) => [e, score(e, terms)] as const)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([e]) => e);
  }, [q, index]);

  if (!open) return null;

  const go = (e?: Entry) => {
    if (!e) return;
    onClose();
    navigate({ href: e.u });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 p-4 pt-[12vh] backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label="Search documentation"
        className="w-full max-w-xl overflow-hidden rounded-xl border bg-popover shadow-2xl animate-in zoom-in-95 slide-in-from-top-2 duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 text-muted-foreground" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === "Enter") go(results[active]);
            }}
            placeholder="Search the documentation"
            className="h-12 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results for "{q}"
            </li>
          )}
          {results.map((e, i) => {
            const [page, section] = e.t.split(" · ");
            return (
              <li key={e.u}>
                <button
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(e)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${i === active ? "bg-accent text-accent-foreground" : ""}`}
                >
                  {section ? (
                    <Hash className="mt-0.5 size-4 shrink-0 opacity-60" />
                  ) : (
                    <FileText className="mt-0.5 size-4 shrink-0 opacity-60" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {section ?? page}
                      {section && (
                        <span className="ml-2 font-normal text-muted-foreground">{page}</span>
                      )}
                    </span>
                    {q && (
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                        {snippet(e.x, (q.split(/\s+/)[0] ?? "").toLowerCase())}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
