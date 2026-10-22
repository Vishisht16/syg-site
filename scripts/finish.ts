// Checks the built site, dist/client, before it is published: every page of
// the manifest was prerendered to the file GitHub Pages serves at its address,
// the files the binary and the installers name are there, and nothing of the
// build's server half is.
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Manifest } from "../src/lib/site";

const dist = join(import.meta.dirname, "..", "dist", "client");
// The sitemap step's list of pages, which the site does not serve.
rmSync(join(dist, "pages.json"), { force: true });
const manifest = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "src", "generated", "manifest.json"), "utf8"),
) as Manifest;

const problems: string[] = [];
const file = (url: string) => (url === "/" ? "index.html" : url.replace(/^\//, ""));
const urls = [
  "/",
  "/books.html",
  "/404.html",
  ...manifest.docs.map((d) => d.url),
  ...manifest.books.flatMap((b) => b.chapters.map((c) => c.url)),
];
for (const url of urls) {
  const f = join(dist, file(url));
  if (!existsSync(f)) {
    problems.push(`no file for ${url}`);
    continue;
  }
  const html = readFileSync(f, "utf8");
  if (!html.startsWith("<!DOCTYPE html>") || !html.includes("</html>"))
    problems.push(`${url} is not a whole page`);
}
for (const f of [
  "install.sh",
  "install.ps1",
  "schemas/diagnostics-v1.json",
  "schemas/snapshot/v1alpha1.json",
  ".well-known/security.txt",
  "robots.txt",
  "sitemap.xml",
  "favicon.svg",
]) {
  if (!existsSync(join(dist, f))) problems.push(`no ${f}`);
}
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)).map((p) => `${e.name}/${p}`) : [e.name],
  );
const all = walk(dist);
for (const f of all) {
  if (/(^|\/)(server|\.vite)(\/|$)|\.map$/.test(f)) problems.push(`${f} is not for the site`);
}

if (problems.length) {
  console.error(`dist/client is not the site:\n${problems.join("\n")}`);
  process.exit(1);
}
console.log(`dist/client: ${urls.length} pages, ${all.length} files`);
