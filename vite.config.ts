import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { SITE, type Manifest } from "./src/lib/site";

// Every page is prerendered to a file at its address, which GitHub Pages
// serves as it is: /install.html, /rules/availability.html, / as index.html.
// The pages come from the manifest scripts/content.ts writes.
const manifestFile = path.resolve(import.meta.dirname, "src/generated/manifest.json");
const manifest: Manifest = existsSync(manifestFile)
  ? JSON.parse(readFileSync(manifestFile, "utf8"))
  : { docs: [], books: [] };
const pages = [
  { path: "/" },
  { path: "/books.html" },
  { path: "/404.html", sitemap: { exclude: true } },
  ...manifest.docs.map((d) => ({ path: d.url })),
  ...manifest.books.flatMap((b) => b.chapters.map((c) => ({ path: c.url }))),
];

export default defineConfig({
  publicDir: "src/generated/public",
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      pages,
      prerender: { enabled: true, crawlLinks: false, failOnError: true },
      sitemap: { enabled: true, host: SITE },
    }),
    viteReact(),
  ],
});
