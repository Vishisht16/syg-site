import data from "@/generated/manifest.json";
import type { Book, Chapter, DocEntry, Manifest, RenderedPage } from "./site";

// The navigation, which scripts/content.ts writes from Syg's docs/.
export const manifest = data as Manifest;
export const docs: DocEntry[] = manifest.docs;
export const books: Book[] = manifest.books;

export const findDoc = (key: string) => docs.find((d) => d.key === key);

export function findChapter(key: string): { book: Book; chapter: Chapter } | undefined {
  for (const book of books) {
    const chapter = book.chapters.find((c) => c.key === key);
    if (chapter) return { book, chapter };
  }
  return undefined;
}

// Each page's rendered HTML is a chunk of its own, loaded when the page is.
const pages = import.meta.glob<RenderedPage>("../generated/pages/**/*.json", { import: "default" });

export function loadPage(key: string): Promise<RenderedPage> {
  const load = pages[`../generated/pages/${key}.json`];
  if (!load) return Promise.reject(new Error(`no page ${key}`));
  return load();
}

export function neighbours<T extends { key: string }>(list: T[], item: { key: string }) {
  const i = list.findIndex((x) => x.key === item.key);
  return {
    prev: i > 0 ? list[i - 1] : undefined,
    next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined,
  };
}
