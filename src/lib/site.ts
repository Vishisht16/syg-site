// The shape of the content scripts/content.ts builds from Syg's docs/, and the
// URLs of the site, which are those of the site this one replaced: a page is
// at its Markdown path with .html for .md (install.md, /install.html;
// rules/availability.md, /rules/availability.html). docs/index.md, the
// overview, is the one exception: / is the landing page, so the overview is
// /overview.html.

export const sections = ["Start", "Concepts", "Reference", "Rules", "Project"] as const;
export type Section = (typeof sections)[number];

/** A page of the documentation. key is its Markdown path in docs/, without .md. */
export type DocEntry = { key: string; url: string; title: string; section: Section };

/** A page of one of the Engineering Notes' volumes. */
export type Chapter = {
  key: string;
  url: string;
  title: string;
  number: number | null;
  minutes: number;
};

export type Book = {
  id: string;
  volume: string;
  title: string;
  subtitle: string;
  url: string;
  chapters: Chapter[];
};

export type Manifest = { docs: DocEntry[]; books: Book[] };

export type Heading = { id: string; text: string; depth: number };
export type RenderedPage = {
  html: string;
  headings: Heading[];
  words: number;
  description: string;
};

/** A search index entry: title, URL, and text to match. */
export type SearchEntry = { t: string; u: string; x: string };

export const SITE = "https://syg.vishisht.tech";

/** The URL of the page whose Markdown is docs/<key>.md. */
export function urlOf(key: string): string {
  return key === "index" ? "/overview.html" : `/${key}.html`;
}

/**
 * The key of the page a path names, as GitHub Pages serves it: /install,
 * /install.html and /install.html/ all name install, /rules/ and
 * /rules/index.html name rules/index, /overview.html names index. The landing
 * page, /, is no key.
 */
export function keyOf(path: string): string | undefined {
  let p = path.replace(/^\/+/, "").replace(/\.html\/+$/, ".html");
  if (p === "" || p === "index.html" || p === "index") return undefined;
  if (p.endsWith("/")) p += "index";
  p = p.replace(/\.html$/, "");
  return p === "overview" ? "index" : p;
}

/**
 * The path as this site writes it, so that the router sees the path each page
 * was prerendered at: /install.html for /install, /rules/index.html for
 * /rules/, / for /index.html. GitHub Pages serves each of these at either
 * spelling; the inline script in __root.tsx does the same before the app
 * starts.
 */
export function canonicalPath(path: string): string {
  if (path === "/" || path === "/index.html") return "/";
  if (path.endsWith("/")) return path + "index.html";
  if (/\.[A-Za-z0-9]+$/.test(path)) return path;
  return path + ".html";
}

/** Whether a site path is a page the router shows, rather than a file. */
export function isPagePath(path: string): boolean {
  return path === "/" || path.endsWith("/") || path.endsWith(".html");
}
