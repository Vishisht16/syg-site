import { createFileRoute } from "@tanstack/react-router";
import { Library } from "@/components/books/Library";
import { SITE } from "@/lib/site";

const title = "The Library · Syg Engineering Notes";
const description =
  "Two volumes on DevOps, platform engineering, Kubernetes and the infrastructure of machine learning, written from first principles.";

export const Route = createFileRoute("/books.html")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
    links: [{ rel: "canonical", href: `${SITE}/books.html` }],
  }),
  component: Library,
});
