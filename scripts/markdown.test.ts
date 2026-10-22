import { describe, expect, it } from "vitest";
import { headingIds, highlight, render, textOf } from "./markdown";

describe("heading ids", () => {
  // The ids the previous site gave these headings (goldmark's), which links
  // in the wild and every rule's docs_url name.
  it("are goldmark's", () => {
    const next = headingIds();
    for (const [heading, id] of [
      ["budget-blocks-eviction", "budget-blocks-eviction"],
      ["What you see", "what-you-see"],
      ["What you see", "what-you-see-1"],
      ["syg.yaml", "sygyaml"],
      ["explain, rules, why, graph", "explain-rules-why-graph"],
      ["SYG_TELEMETRY", "syg-telemetry"],
      ["Mistakes you can't make", "mistakes-you-cant-make"],
      ["`--format`", "--format"],
      ["Résumé", "rsum"],
      ["日本", "heading"],
    ] as const) {
      expect(next(heading), heading).toBe(id);
    }
  });

  it("count a link by its text", () => {
    expect(headingIds()("[Availability](../rules/availability.md)")).toBe("availability");
  });
});

describe("render", () => {
  const resolve = (href: string) =>
    href === "install.md"
      ? "/install.html"
      : href.startsWith("https:")
        ? href
        : href.startsWith("#")
          ? href
          : null;

  it("gives each section the id its address names", () => {
    const r = render(
      "# Availability\n\nLead.\n\n## single-replica-budget\n\nText.\n\n### What you see\n\nMore.\n",
      resolve,
    );
    expect(r.html).toContain('<h1 class="page-title" id="availability">Availability</h1>');
    expect(r.html).toContain('<h2 id="single-replica-budget">');
    expect(r.headings.map((h) => h.id)).toEqual(["single-replica-budget", "what-you-see"]);
    expect(r.lead).toBe("Lead.");
    expect(r.sections).toEqual([
      {
        id: "single-replica-budget",
        title: "single-replica-budget",
        text: "Text. What you see More.",
      },
    ]);
  });

  it("links pages to their addresses, keeps the text of a link to nothing, and opens other sites apart", () => {
    const r = render(
      "[Install](install.md), [the source](../internal/x.go) and [Go](https://go.dev).",
      resolve,
    );
    expect(r.html).toContain('<a href="/install.html">Install</a>');
    expect(r.html).toContain("the source and");
    expect(r.html).toContain('<a href="https://go.dev" target="_blank" rel="noopener">Go</a>');
  });

  it("marks code up safely, with its language", () => {
    const r = render("```yaml\nkind: <Pod>\n```\n\n```mermaid\ngraph TD; A-->B\n```\n", resolve);
    expect(r.html).toContain('<span class="code-lang">YAML</span>');
    expect(r.html).toContain("&lt;Pod&gt;");
    expect(r.html).not.toContain("<Pod>");
    expect(r.html).toContain('<pre class="mermaid-src" hidden>graph TD; A--&gt;B</pre>');
  });

  it("drops the chapter number from a chapter's title", () => {
    expect(render("# Chapter 5: Containers\n", resolve, { chapter: true }).html).toContain(
      ">Containers</h1>",
    );
  });

  it("gives the table of contents plain text", () => {
    expect(render("# T\n\n## Mistakes you can't make\n", resolve).headings[0]?.text).toBe(
      "Mistakes you can't make",
    );
    expect(textOf("<code>a &amp; b</code> &#39;c&#x27;")).toBe("a & b 'c'");
  });
});

describe("highlight", () => {
  it("marks Syg's words, strings and comments", () => {
    const h = highlight('service api {\n  image "x:1" # pinned\n}', "syg");
    expect(h).toContain('<span class="tk-k">service</span>');
    expect(h).toContain('<span class="tk-s">&quot;x:1&quot;</span>');
    expect(h).toContain('<span class="tk-c"># pinned</span>');
  });

  it("marks a session's commands and leaves its output", () => {
    const h = highlight("$ syg check\nerror: <x>", "console");
    expect(h).toBe(
      '<span class="tk-c">$</span> <span class="tk-k">syg</span> check\nerror: &lt;x&gt;',
    );
  });
});
