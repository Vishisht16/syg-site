// Builds the site's content from Syg's documentation, as Syg's repository
// publishes it: docs/ (the Markdown and the schemas) and the install scripts
// at its root. SYG_DIR names a checkout of github.com/Vishisht16/Syg; without
// it, one is cloned into .syg.
//
// It writes src/generated/: manifest.json (the navigation), search.json (the
// documentation's search index), pages/<key>.json (each page, rendered), and
// public/, which Vite serves at the site's root: the install scripts, the
// schemas, security.txt, and the files in static/.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative } from "node:path";
import { render, type Resolve } from "./markdown";
import {
  keyOf,
  SITE,
  urlOf,
  type Book,
  type Chapter,
  type DocEntry,
  type Manifest,
  type RenderedPage,
  type SearchEntry,
  type Section,
} from "../src/lib/site";

const root = join(import.meta.dirname, "..");
const out = join(root, "src", "generated");

// The documentation's pages in navigation order, as Syg's own site generator
// lists them (internal/cli/docs.go): the authored pages, then the generated
// ones. A page missing from docs/ is skipped; a page docs/ has that is not
// here is listed at the end of Project, with a warning to add it here.
const AUTHORED: [string, Section][] = [
  ["index", "Start"],
  ["install", "Start"],
  ["quickstart", "Start"],
  ["derivation", "Concepts"],
  ["checks", "Concepts"],
  ["golden-paths", "Concepts"],
  ["custom-resources", "Concepts"],
  ["network-policy", "Concepts"],
  ["language", "Reference"],
  ["cli", "Reference"],
  ["ci", "Reference"],
  ["container", "Reference"],
  ["derivation-map", "Reference"],
  ["migrate-helm", "Project"],
  ["compatibility", "Project"],
  ["performance", "Project"],
  ["security", "Project"],
  ["testing", "Project"],
  ["network", "Project"],
  ["privacy", "Project"],
  ["support", "Project"],
  ["eula", "Project"],
  ["grammar", "Reference"],
  ["non-goals", "Project"],
];

// The files the binary and the installers name by URL: without them the site
// is not published.
const REQUIRED = [
  "install.sh",
  "install.ps1",
  "schemas/diagnostics-v1.json",
  "schemas/snapshot/v1alpha1.json",
];

function sygDir(): string {
  const dir = process.env["SYG_DIR"];
  if (dir) return dir;
  const clone = join(root, ".syg");
  if (!existsSync(clone)) {
    const ref = process.env["SYG_REF"] ?? "main";
    console.log(`cloning github.com/Vishisht16/Syg at ${ref} into .syg`);
    execFileSync(
      "git",
      ["clone", "-q", "--depth", "1", "--branch", ref, "https://github.com/Vishisht16/Syg", clone],
      {
        stdio: "inherit",
      },
    );
  }
  return clone;
}

// Every file in a directory but the hidden ones: a dotfile in docs/, such as
// the marker `syg docs build` leaves in its output, is not published.
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : e.isFile() ? [join(dir, e.name)] : [],
    )
    .sort();
}

/** A document's first heading, as Syg's generator takes it, or name. */
function titleOf(md: string, name: string): string {
  const m = /^# (.+)$/m.exec(md);
  return m ? m[1]!.replace(/[`*]/g, "").trim() : name;
}

const warn = (msg: string) =>
  console.log(process.env["GITHUB_ACTIONS"] ? `::warning::${msg}` : `warning: ${msg}`);

const syg = sygDir();
const docsDir = join(syg, "docs");
if (!existsSync(join(docsDir, "index.md"))) {
  console.error(`${docsDir} holds no index.md: SYG_DIR must name a checkout of Syg's repository`);
  process.exit(1);
}
let commit = "";
try {
  commit = execFileSync("git", ["-C", syg, "rev-parse", "HEAD"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  // not a git checkout
}

// Every page: docs/<key>.md. README.md is index.md again, for GitHub's
// listing, and the changelog is published with the releases.
const sources = new Map<string, string>();
const files: string[] = [];
for (const f of walk(docsDir)) {
  const rel = relative(docsDir, f).split("\\").join("/");
  if (rel.endsWith(".md")) {
    if (rel !== "README.md" && rel !== "CHANGELOG.md")
      sources.set(rel.slice(0, -3), readFileSync(f, "utf8"));
  } else {
    files.push(rel);
  }
}

// The documentation, in order.
const order: [string, Section][] = [...AUTHORED];
const areas = [
  ...(sources.get("rules/index") ?? "").matchAll(/^## \[[^\]]*\]\(([^)#]+)\.md\)/gm),
].map((m) => posix.basename(m[1]!));
for (const k of [...sources.keys()]
  .filter((k) => /^rules\/[^/]+$/.test(k) && k !== "rules/index")
  .sort()) {
  const area = k.slice("rules/".length);
  if (!areas.includes(area)) areas.push(area);
}
order.push(...areas.map((a): [string, Section] => [`rules/${a}`, "Rules"]));
order.push(["rules/index", "Reference"]);
const topics = [...sources.keys()]
  .filter((k) => /^topics\/[^/]+$/.test(k) && k !== "topics/messages")
  .sort();
order.push(...topics.map((t): [string, Section] => [t, "Concepts"]));
order.push(["topics/messages", "Reference"]);
for (const k of sources.keys()) {
  if (!k.startsWith("notes/") && !order.some(([o]) => o === k)) {
    warn(`docs/${k}.md is not in scripts/content.ts's AUTHORED list: it is listed under Project`);
    order.push([k, "Project"]);
  }
}
const docs: DocEntry[] = order
  .filter(([k]) => sources.has(k))
  .map(([key, section]) => ({
    key,
    url: urlOf(key),
    title: key === "index" ? "Overview" : titleOf(sources.get(key)!, key),
    section,
  }));
const known = new Set(order.map(([k]) => k));
for (const [k] of AUTHORED)
  if (!sources.has(k)) console.log(`docs/${k}.md is not in this version of the docs`);

// The Engineering Notes: a volume per directory, its introduction, its
// chapters in order, its glossary.
const volumes = [
  { id: "engineering", dir: "notes", volume: "Volume I" },
  { id: "ai", dir: "notes/ai", volume: "Volume II" },
];
const rank = (key: string) => {
  const name = posix.basename(key);
  return name === "index" ? "0" : name === "glossary" ? "2" : "1" + name;
};
const books: Book[] = volumes
  .filter((v) => sources.has(`${v.dir}/index`))
  .map((v) => {
    const keys = [...sources.keys()]
      .filter((k) => posix.dirname(k) === v.dir)
      .sort((a, b) => (rank(a) < rank(b) ? -1 : 1));
    const intro = sources.get(`${v.dir}/index`)!;
    const heading = titleOf(intro, v.volume);
    const subtitle = /^# .+\n+\*([^*]+)\*\s*$/m.exec(intro)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const chapters: Chapter[] = keys.map((key) => {
      const md = sources.get(key)!;
      const t = titleOf(md, key);
      const m = /^Chapter (\d+):\s*(.+)$/.exec(t);
      const name = posix.basename(key);
      return {
        key,
        url: urlOf(key),
        title: m ? m[2]! : name === "index" ? "Introduction" : name === "glossary" ? "Glossary" : t,
        number: m ? Number(m[1]) : null,
        minutes: Math.max(1, Math.round(md.split(/\s+/).length / 230)),
      };
    });
    return {
      id: v.id,
      volume: v.volume,
      title: heading.replace(/^.*?, Volume [IVX]+: /, ""),
      subtitle,
      url: urlOf(`${v.dir}/index`),
      chapters,
    };
  });
for (const k of sources.keys()) {
  if (k.startsWith("notes/") && !books.some((b) => b.chapters.some((c) => c.key === k))) {
    warn(`docs/${k}.md is in no volume of the Engineering Notes: it is not published`);
  }
}

// Each link goes where it went on the previous site: a page's Markdown to
// its URL, a file in docs/ to that file, a link to this site's own address to
// the same place here.
const pages = new Set(
  [...known, ...books.flatMap((b) => b.chapters.map((c) => c.key))].filter((k) => sources.has(k)),
);
const statics = new Set([...files, "install.sh", "install.ps1"]);
function sitePath(path: string, hash: string): string | null {
  const key = keyOf(path);
  if (key === undefined) return "/" + hash;
  if (pages.has(key)) return urlOf(key) + hash;
  if (pages.has(`${key}/index`)) return urlOf(`${key}/index`) + hash;
  const file = path.replace(/^\/+/, "");
  return statics.has(file) ? `/${file}${hash}` : null;
}
function resolver(key: string): Resolve {
  const dir = posix.dirname(`${key}.md`);
  return (href) => {
    if (href.startsWith("#")) return href;
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
      if (href.startsWith(SITE + "/") || href === SITE) {
        const u = new URL(href);
        return sitePath(u.pathname, u.hash) ?? href;
      }
      return href;
    }
    const [path = "", ...rest] = href.split("#");
    const hash = rest.length ? "#" + rest.join("#") : "";
    const target = posix.normalize(posix.join(dir, decodeURI(path)));
    if (target.endsWith(".md")) {
      const k = target.slice(0, -3) === "README" ? "index" : target.slice(0, -3);
      return pages.has(k) ? urlOf(k) + hash : null;
    }
    return statics.has(target) ? `/${target}${hash}` : null;
  };
}

/** A page's description for search engines: its first sentences, to about 160 characters. */
function describe(lead: string): string {
  if (lead.length <= 160) return lead;
  const cut = lead.slice(0, 160);
  const stop = cut.lastIndexOf(". ");
  return stop > 60 ? cut.slice(0, stop + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

rmSync(out, { recursive: true, force: true });
const search: SearchEntry[] = [];
let count = 0;
for (const key of pages) {
  const isChapter = key.startsWith("notes/");
  const r = render(sources.get(key)!, resolver(key), { chapter: isChapter });
  const file = join(out, "pages", `${key}.json`);
  mkdirSync(dirname(file), { recursive: true });
  const page: RenderedPage = {
    html: r.html,
    headings: r.headings,
    words: r.words,
    description: describe(r.lead),
  };
  writeFileSync(file, JSON.stringify(page));
  count++;
  const doc = docs.find((d) => d.key === key);
  if (!doc) continue;
  search.push({ t: doc.title, u: doc.url, x: r.lead.slice(0, 400) });
  for (const s of r.sections)
    search.push({
      t: `${doc.title} · ${s.title}`,
      u: `${doc.url}#${s.id}`,
      x: s.text.slice(0, 300),
    });
}
const manifest: Manifest = { docs, books };
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
writeFileSync(join(out, "search.json"), JSON.stringify(search));

// The files served as they are.
const pub = join(out, "public");
cpSync(join(root, "static"), pub, { recursive: true });
for (const f of files) cpSync(join(docsDir, f), join(pub, f));
for (const f of ["install.sh", "install.ps1"])
  if (existsSync(join(syg, f))) cpSync(join(syg, f), join(pub, f));
const missing = REQUIRED.filter((f) => !existsSync(join(pub, f)));
if (missing.length) {
  console.error(`Syg's checkout at ${syg} lacks ${missing.join(", ")}, which the site must serve`);
  process.exit(1);
}
// The commit of Syg the site was built from, which Syg's publish-docs.yml
// waits to see served after it publishes its docs.
writeFileSync(join(pub, "build.json"), JSON.stringify({ syg: commit }) + "\n");
// RFC 9116: where to report a vulnerability. It expires within a year, so
// each build writes it afresh, and the site is rebuilt daily.
const expires = new Date(Date.now() + 364 * 24 * 3600 * 1000).toISOString().slice(0, 10);
mkdirSync(join(pub, ".well-known"), { recursive: true });
writeFileSync(
  join(pub, ".well-known", "security.txt"),
  [
    "Contact: https://github.com/vishisht16/syg/security/advisories/new",
    "Contact: mailto:syg@vishisht.tech",
    `Expires: ${expires}T00:00:00Z`,
    `Acknowledgments: ${SITE}/security.html#hall-of-fame`,
    "Policy: https://github.com/vishisht16/syg/security/policy",
    "Preferred-Languages: en",
    `Canonical: ${SITE}/.well-known/security.txt`,
    "",
  ].join("\n"),
);

console.log(
  `${count} pages from ${syg}${commit ? ` at ${commit.slice(0, 12)}` : ""}: ` +
    `${docs.length} in the documentation, ${books.map((b) => b.chapters.length).join(" and ")} in the Engineering Notes; ` +
    `${search.length} search entries, ${files.length + 2} files`,
);
