import { describe, expect, it } from "vitest";
import { clampSettings, DEFAULT_SETTINGS } from "@/components/books/useReaderSettings";

describe("reader settings", () => {
  it("keeps text size between 15 and 28px", () => {
    expect(clampSettings({ size: 4 }).size).toBe(15);
    expect(clampSettings({ size: 99 }).size).toBe(28);
  });
  it("keeps page width between 30 and 50rem", () => {
    expect(clampSettings({ width: 10 }).width).toBe(30);
    expect(clampSettings({ width: 80 }).width).toBe(50);
  });
  it("defaults to the cream theme with a serif face", () => {
    expect(DEFAULT_SETTINGS.theme).toBe("cream");
    expect(DEFAULT_SETTINGS.font).toBe("serif");
  });
});
