import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

// Each address the site serves goes to the route that renders it. Only
// matching is tested here: the pages themselves are checked built
// (scripts/finish.ts) and served (scripts/check-site.sh).
describe("routes", () => {
  const router = createRouter({ routeTree });
  const route = (path: string) => router.matchRoutes(path).at(-1)?.routeId;

  it("sends each address to its page", () => {
    expect(route("/")).toBe("/");
    expect(route("/install.html")).toBe("/$");
    expect(route("/overview.html")).toBe("/$");
    expect(route("/rules/availability.html")).toBe("/$");
    expect(route("/topics/qos.html")).toBe("/$");
    expect(route("/notes/05-containers.html")).toBe("/notes/$");
    expect(route("/notes/ai/index.html")).toBe("/notes/$");
    expect(route("/books.html")).toBe("/books.html");
    expect(route("/404.html")).toBe("/404.html");
    expect(route("/")).not.toBe(rootRouteId);
  });
});
