import { createFileRoute, notFound } from "@tanstack/react-router";
import { Reader, ReaderSkeleton } from "@/components/books/Reader";
import { findChapter, loadPage } from "@/lib/content";
import { keyOf, SITE } from "@/lib/site";

// The Engineering Notes: Volume I at /notes/, Volume II at /notes/ai/, each
// chapter at its address on the previous site.
export const Route = createFileRoute("/notes/$")({
  loader: async ({ params }) => {
    const key = keyOf(`notes/${params._splat ?? ""}`);
    const found = key === undefined ? undefined : (findChapter(key) ?? findChapter(`${key}/index`));
    if (!found) throw notFound();
    return { ...found, page: await loadPage(found.chapter.key) };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Page not found · Syg" }, { name: "robots", content: "noindex" }] };
    const { book, chapter, page } = loaderData;
    const title =
      chapter.number === null && chapter.title === "Introduction"
        ? book.title
        : `${chapter.title} · ${book.title}`;
    return {
      meta: [
        { title },
        { name: "description", content: page.description },
        { property: "og:title", content: title },
        { property: "og:description", content: page.description },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: SITE + chapter.url }],
    };
  },
  pendingComponent: ReaderSkeleton,
  component: ChapterRoute,
});

function ChapterRoute() {
  const { book, chapter, page } = Route.useLoaderData();
  return <Reader book={book} chapter={chapter} page={page} />;
}
