import { createFileRoute, notFound } from "@tanstack/react-router";
import { DocPage, DocSkeleton } from "@/components/docs/DocPage";
import { DocsLayout } from "@/components/docs/DocsLayout";
import { findDoc, loadPage } from "@/lib/content";
import { keyOf, SITE } from "@/lib/site";

// Every page of the documentation, at its address on the previous site:
// /install.html, /rules/availability.html, /topics/qos.html, and the
// overview at /overview.html.
export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const key = keyOf(params._splat ?? "");
    const doc = key === undefined ? undefined : (findDoc(key) ?? findDoc(`${key}/index`));
    if (!doc) throw notFound();
    return { doc, page: await loadPage(doc.key) };
  },
  head: ({ loaderData }) => {
    if (!loaderData)
      return { meta: [{ title: "Page not found · Syg" }, { name: "robots", content: "noindex" }] };
    const { doc, page } = loaderData;
    const title = doc.key === "index" ? "Syg documentation" : `${doc.title} · Syg`;
    return {
      meta: [
        { title },
        { name: "description", content: page.description },
        { property: "og:title", content: title },
        { property: "og:description", content: page.description },
        { property: "og:type", content: "article" },
      ],
      links: [{ rel: "canonical", href: SITE + doc.url }],
    };
  },
  pendingComponent: () => (
    <DocsLayout>
      <DocSkeleton />
    </DocsLayout>
  ),
  component: DocRoute,
});

function DocRoute() {
  const { doc, page } = Route.useLoaderData();
  return (
    <DocsLayout>
      <DocPage doc={doc} page={page} />
    </DocsLayout>
  );
}
