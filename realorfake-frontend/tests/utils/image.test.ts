import { describe, it, expect } from "vitest";
import { base64ToDataUrl, fileToBase64 } from "@/lib/utils/image";

describe("base64ToDataUrl", () => {
  it("returns a properly-prefixed data URI", () => {
    const b64 = "abc123";
    const result = base64ToDataUrl(b64, "image/png");
    expect(result).toBe("data:image/png;base64,abc123");
  });

  it("defaults to image/png", () => {
    const result = base64ToDataUrl("xyz");
    expect(result).toMatch(/^data:image\/png;base64,/);
  });
});

describe("fileToBase64", () => {
  it("returns a base64 string of the file content", async () => {
    const content = new Uint8Array([1, 2, 3, 4]);
    const file = new File([content], "test.jpg", { type: "image/jpeg" });
    const result = await fileToBase64(file);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
    // Should not include data: prefix
    expect(result).not.toMatch(/^data:/);
  });
});
