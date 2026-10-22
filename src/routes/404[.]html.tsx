import { createFileRoute } from "@tanstack/react-router";
import { NotFound } from "@/components/site/NotFound";

// GitHub Pages serves 404.html for an address with no page. The meta tag
// keeps the address as it was typed (__root.tsx).
export const Route = createFileRoute("/404.html")({
  head: () => ({
    meta: [
      { title: "Page not found · Syg" },
      { name: "robots", content: "noindex" },
      { name: "syg-page", content: "404" },
    ],
  }),
  component: NotFound,
});
