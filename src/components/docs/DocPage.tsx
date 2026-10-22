import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Copy, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { docs, neighbours } from "@/lib/content";
import type { DocEntry, RenderedPage } from "@/lib/site";
import { useArticleClick } from "@/components/site/useArticleBehaviour";
import { HtmlArticle } from "@/components/site/HtmlArticle";
import { useMermaid } from "@/components/site/useMermaid";

export function DocPage({ doc, page }: { doc: DocEntry; page: RenderedPage }) {
  const onClick = useArticleClick();
  const articleRef = useRef<HTMLDivElement>(null);
  useMermaid(articleRef, [page.html]);
  const { prev, next } = neighbours(docs, doc);
  const toc = page.headings.filter((h) => h.depth === 2 || h.depth === 3);
  const [activeId, setActiveId] = useState<string>();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const els = toc.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const first = vis[0];
        if (first) setActiveId(first.target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href.split("#")[0] ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="flex gap-10 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
      <article key={doc.key} className="mx-auto w-full max-w-[46rem] min-w-0 animate-rise">
        <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-[0.12em] text-primary">{doc.section}</span>
          <span className="flex items-center gap-3">
            <span>{Math.max(1, Math.round(page.words / 230))} min read</span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted hover:text-foreground"
              aria-label="Copy page link"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Link"}
            </button>
          </span>
        </div>
        <HtmlArticle
          ref={articleRef}
          as="div"
          className="prose-docs"
          onClick={onClick}
          html={page.html}
        />
        <nav className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2" aria-label="Pagination">
          {prev ? (
            <Link
              to={prev.url}
              className="group rounded-lg border p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />{" "}
                Previous
              </span>
              <span className="mt-1 block font-medium">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={next.url}
              className="group rounded-lg border p-4 text-right transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next{" "}
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block font-medium">{next.title}</span>
            </Link>
          )}
        </nav>
      </article>
      {toc.length > 1 && (
        <aside className="sticky top-24 hidden h-fit max-h-[calc(100vh-8rem)] w-56 shrink-0 overflow-y-auto xl:block">
          <p className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/80">
            On this page
          </p>
          <ul className="space-y-1 border-l text-[13px]">
            {toc.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={`-ml-px block border-l py-1 transition-colors ${h.depth === 3 ? "pl-6" : "pl-3"} ${
                    activeId === h.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}

export function DocSkeleton() {
  return (
    <div className="mx-auto max-w-[46rem] space-y-4 px-5 py-14 sm:px-8">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: `${90 - i * 7}%` }}
        />
      ))}
    </div>
  );
}
