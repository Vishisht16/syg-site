import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, FileCode2, ShieldCheck, Workflow } from "lucide-react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { books, docs, findDoc } from "@/lib/content";
import { SITE } from "@/lib/site";

const title = "Syg · Typed deployments for Kubernetes";
const description =
  "Syg is a typed language for a Kubernetes service's deployment surface, and a compiler that derives the manifests from it and checks them before they reach a cluster.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
  }),
  component: Home,
});

const sample = `module shop

service api {
  image "registry.example.com/api:1.4.2"
  replicas 3
  port http 8080
}`;

const url = (key: string) => findDoc(key)?.url ?? "/overview.html";
const library = "/books.html";
const count = (n: number) => ["no", "one", "two", "three", "four"][n] ?? String(n);

function Home() {
  const start = docs.filter((d) => d.section === "Start" || d.section === "Concepts").slice(0, 6);
  const chapters = books.reduce(
    (n, b) => n + b.chapters.filter((c) => c.number !== null).length,
    0,
  );
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="animate-rise">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
                Typed Kubernetes deployments
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">
                Declare a service once.
                <br />
                <span className="text-muted-foreground">Derive every manifest.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Syg derives the Deployment, Service, budget, autoscaler, route, identity and network
                policy from one declaration, and checks them together before anything reaches a
                cluster.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={url("quickstart")}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                >
                  Quickstart <ArrowRight className="size-4" />
                </Link>
                <Link
                  to={url("index")}
                  className="inline-flex h-10 items-center rounded-md border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Read the docs
                </Link>
              </div>
            </div>
            <div className="animate-rise self-center" style={{ animationDelay: "100ms" }}>
              <div className="overflow-hidden rounded-xl border bg-card shadow-[0_20px_50px_-20px_color-mix(in_oklab,var(--primary)_35%,transparent)]">
                <div className="flex items-center gap-1.5 border-b px-4 py-2.5">
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="size-2.5 rounded-full bg-border" />
                  <span className="ml-3 font-mono text-xs text-muted-foreground">shop.syg</span>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-[13px] leading-7 text-code-foreground">
                  {sample}
                </pre>
                <div className="border-t bg-muted/50 px-5 py-3 font-mono text-xs text-muted-foreground">
                  <span className="text-primary">$</span> syg build
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: FileCode2,
                t: "One typed source",
                d: "Image, ports, needs, exposure and disruption, declared once, in a language built for it.",
              },
              {
                icon: Workflow,
                t: "Derived, not templated",
                d: "Every Kubernetes object follows from the declaration, so they can never drift apart.",
              },
              {
                icon: ShieldCheck,
                t: "Checked together",
                d: "Findings arrive at the line, with what goes wrong, why, and how to fix it.",
              },
            ].map(({ icon: Icon, t, d }) => (
              <div
                key={t}
                className="rounded-xl border p-6 transition-colors hover:border-primary/40"
              >
                <Icon className="size-5 text-primary" />
                <p className="mt-4 font-medium">{t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-24 sm:px-8 lg:grid-cols-2">
          <div className="rounded-2xl border p-8">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Documentation
            </p>
            <ul className="mt-5 divide-y">
              {start.map((d) => (
                <li key={d.key}>
                  <Link to={d.url} className="group flex items-center justify-between py-3 text-sm">
                    <span>{d.title}</span>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link
            to={library}
            className="reader group relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl p-8"
            data-theme="cream"
            style={{ minHeight: "20rem" }}
          >
            <BookOpen className="size-5" style={{ color: "var(--r-accent)" }} />
            <div>
              <p className="font-display text-4xl leading-tight">The Engineering Notes</p>
              <p
                className="mt-3 max-w-sm font-serif text-lg italic"
                style={{ color: "var(--r-muted)" }}
              >
                {chapters} chapters across {count(books.length)} volumes. A slow, cozy read on how
                software is run.
              </p>
              <span
                className="mt-6 inline-flex items-center gap-2 text-sm"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Open the library{" "}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </section>
      </main>
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:px-8">
          <span>Syg</span>
          <div className="flex gap-5">
            <Link to={url("privacy")} className="hover:text-foreground">
              Privacy
            </Link>
            <Link to={url("eula")} className="hover:text-foreground">
              EULA
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
