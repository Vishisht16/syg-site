import { describe, expect, it } from "vitest";
import { canonicalPath, isPagePath, keyOf, urlOf } from "@/lib/site";
import { pathScript } from "@/lib/scripts";

describe("addresses", () => {
  it("puts a page at its Markdown path, with the overview at /overview.html", () => {
    expect(urlOf("install")).toBe("/install.html");
    expect(urlOf("rules/availability")).toBe("/rules/availability.html");
    expect(urlOf("rules/index")).toBe("/rules/index.html");
    expect(urlOf("notes/ai/index")).toBe("/notes/ai/index.html");
    expect(urlOf("index")).toBe("/overview.html");
  });

  it("finds a page by any address GitHub Pages serves it at", () => {
    for (const [path, key] of [
      ["/install", "install"],
      ["/install.html", "install"],
      ["/install.html/", "install"],
      ["install.html", "install"],
      ["/rules/", "rules/index"],
      ["/rules/index.html", "rules/index"],
      ["/rules/availability.html", "rules/availability"],
      ["/notes/ai/", "notes/ai/index"],
      ["/overview.html", "index"],
      ["/overview", "index"],
    ] as const) {
      expect(keyOf(path), path).toBe(key);
    }
    expect(keyOf("/")).toBeUndefined();
    expect(keyOf("/index.html")).toBeUndefined();
  });

  it("writes each address the way its page was prerendered", () => {
    for (const [path, want] of [
      ["/", "/"],
      ["/index.html", "/"],
      ["/install", "/install.html"],
      ["/install.html", "/install.html"],
      ["/rules/", "/rules/index.html"],
      ["/notes/ai/", "/notes/ai/index.html"],
      ["/notes/05-containers", "/notes/05-containers.html"],
      ["/install.sh", "/install.sh"],
    ] as const) {
      expect(canonicalPath(path), path).toBe(want);
    }
  });

  it("tells a page from a file", () => {
    expect(isPagePath("/rules/availability.html")).toBe(true);
    expect(isPagePath("/rules/")).toBe(true);
    expect(isPagePath("/")).toBe(true);
    expect(isPagePath("/install.sh")).toBe(false);
    expect(isPagePath("/schemas/diagnostics-v1.json")).toBe(false);
  });
});

// The inline script and canonicalPath must agree, or the router hydrates an
// address no page was prerendered at.
describe("the inline address script", () => {
  const run = (path: string, notFound = false) => {
    let replaced: string | undefined;
    const location = { pathname: path, search: "?q=1", hash: "#h" };
    const history = {
      state: null,
      replaceState: (_s: unknown, _t: string, url: string) => (replaced = url),
    };
    const document = { querySelector: () => (notFound ? {} : null) };
    new Function("location", "history", "document", pathScript)(location, history, document);
    return replaced;
  };

  it("does what canonicalPath does", () => {
    for (const path of [
      "/",
      "/index.html",
      "/install",
      "/install.html",
      "/rules/",
      "/notes/ai/",
      "/a/b",
      "/x.sh",
    ]) {
      const want = canonicalPath(path);
      expect(run(path), path).toBe(want === path ? undefined : `${want}?q=1#h`);
    }
  });

  it("leaves the address of a page that does not exist", () => {
    expect(run("/nope", true)).toBeUndefined();
  });
});
