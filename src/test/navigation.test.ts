import { describe, expect, it } from "vitest";
import data from "@/generated/manifest.json";
import { docs, neighbours } from "@/lib/content";
import { sections, type Manifest } from "@/lib/site";

describe("reading the documentation page to page", () => {
  it("holds every page, once", () => {
    const keys = (data as Manifest).docs.map((d) => d.key).sort();
    expect(docs.map((d) => d.key).sort()).toEqual(keys);
  });

  it("goes in the navigation's order: section by section, as the sidebar lists them", () => {
    const sidebar = sections.flatMap((sec) =>
      (data as Manifest).docs.filter((d) => d.section === sec),
    );
    expect(docs.map((d) => d.key)).toEqual(sidebar.map((d) => d.key));
  });

  it("leads from each page to the one below it in the sidebar, and back", () => {
    docs.forEach((d, i) => {
      const { prev, next } = neighbours(docs, d);
      expect(prev?.key, d.key).toBe(docs[i - 1]?.key);
      expect(next?.key, d.key).toBe(docs[i + 1]?.key);
    });
  });
});
