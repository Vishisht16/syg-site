import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { books } from "@/lib/content";
import type { Book } from "@/lib/site";
import { readLastRead } from "@/components/books/useReaderSettings";

const covers = [
  { bg: "oklch(0.32 0.05 250)", fg: "oklch(0.93 0.03 85)", accent: "oklch(0.78 0.1 70)" },
  { bg: "oklch(0.42 0.09 35)", fg: "oklch(0.95 0.025 85)", accent: "oklch(0.88 0.06 80)" },
];

// A page of the documentation, which the router reaches through /$.
const overview: string = "/overview.html";
const library = "/books.html";
const numbered = (b: Book) => b.chapters.filter((c) => c.number !== null);

function Cover({ book, i }: { book: Book; i: number }) {
  const c = covers[i % covers.length]!;
  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-l-sm rounded-r-md p-6 shadow-[0_1px_2px_oklch(0_0_0/0.1),0_18px_40px_-16px_oklch(0.2_0.03_60/0.5)] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-0.6deg]"
      style={{ background: c.bg, color: c.fg }}
    >
      <div
        className="absolute inset-y-0 left-0 w-3"
        style={{ background: "linear-gradient(90deg, oklch(0 0 0 / 0.25), transparent)" }}
      />
      <div className="flex h-full flex-col">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-80">{book.volume}</p>
        <div className="mt-auto">
          <div className="mb-4 h-px w-10" style={{ background: c.accent }} />
          <p className="font-display text-3xl leading-[1.05] sm:text-4xl">{book.title}</p>
          <p className="mt-3 font-serif text-sm italic opacity-80">
            {numbered(book).length} chapters
          </p>
        </div>
      </div>
    </div>
  );
}

export function Library() {
  const [last, setLast] = useState<Record<string, string>>({});
  useEffect(() => setLast(readLastRead()), []);
  const latestId = last["__latest"];
  const latest = latestId ? books.find((b) => b.id === latestId) : undefined;
  const latestCh = latest?.chapters.find((c) => c.key === last[latest.id]);

  return (
    <div className="reader min-h-screen" data-theme="cream">
      <header
        className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <Link to={library} className="font-display text-2xl">
          The Library
        </Link>
        <Link to={overview} className="text-sm opacity-60 transition-opacity hover:opacity-100">
          Documentation →
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-5 pb-12 pt-10 sm:px-8 sm:pt-16">
        <p
          className="animate-rise text-xs uppercase tracking-[0.25em]"
          style={{ color: "var(--r-muted)" }}
        >
          Engineering, slowly
        </p>
        <h1
          className="mt-4 max-w-3xl animate-rise font-display text-5xl leading-[1.02] sm:text-7xl"
          style={{ animationDelay: "60ms" }}
        >
          Make a cup of something.{" "}
          <em className="italic" style={{ color: "var(--r-accent)" }}>
            Settle in.
          </em>
        </h1>
        <p
          className="mt-6 max-w-xl animate-rise font-serif text-lg leading-relaxed sm:text-xl"
          style={{ color: "var(--r-muted)", animationDelay: "120ms" }}
        >
          Two volumes that teach how software is run for other people, from the first deploy to
          models at scale, written for anyone who can program and wants to understand the rest.
        </p>

        {latest && latestCh && (
          <Link
            to={latestCh.url}
            className="mt-10 inline-flex animate-rise items-center gap-3 rounded-full px-5 py-3 text-sm transition-transform hover:-translate-y-0.5"
            style={{
              background: "var(--r-fg)",
              color: "var(--r-bg)",
              fontFamily: "var(--font-sans)",
            }}
          >
            <BookOpen className="size-4" /> Continue: {latestCh.title}{" "}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </section>

      <section className="mx-auto grid max-w-5xl gap-14 px-5 pb-28 sm:grid-cols-2 sm:gap-12 sm:px-8">
        {books.map((b, i) => {
          const chapters = numbered(b);
          return (
            <div
              key={b.id}
              className="animate-rise"
              style={{ animationDelay: `${180 + i * 80}ms` }}
            >
              <Link to={b.url} className="group block">
                <div className="mx-auto max-w-[17rem]">
                  <Cover book={b} i={i} />
                </div>
                <p className="mt-8 font-display text-3xl">{b.title}</p>
                <p className="mt-2 font-serif text-lg italic" style={{ color: "var(--r-muted)" }}>
                  {b.subtitle}
                </p>
              </Link>
              <ol className="mt-6 space-y-1 font-serif text-[15px]">
                {chapters.slice(0, 5).map((c) => (
                  <li key={c.key}>
                    <Link
                      to={c.url}
                      className="flex gap-3 py-0.5 opacity-80 transition-opacity hover:opacity-100"
                    >
                      <span
                        className="w-5 text-right tabular-nums"
                        style={{ color: "var(--r-muted)" }}
                      >
                        {c.number}
                      </span>
                      {c.title}
                    </Link>
                  </li>
                ))}
                {chapters.length > 5 && (
                  <li className="pl-8 pt-1 text-sm italic" style={{ color: "var(--r-muted)" }}>
                    and {chapters.length - 5} more…
                  </li>
                )}
              </ol>
            </div>
          );
        })}
      </section>
    </div>
  );
}
