import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateImageFile } from "@/lib/utils/file-validation";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buf = new ArrayBuffer(sizeBytes);
  return new File([buf], name, { type });
}

describe("validateImageFile", () => {
  it("accepts a valid JPEG under the limit", () => {
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    expect(validateImageFile(file).ok).toBe(true);
  });

  it("rejects unsupported MIME type", () => {
    const file = makeFile("doc.pdf", "application/pdf", 1024);
    const result = validateImageFile(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it("rejects oversized file", () => {
    const file = makeFile("big.jpg", "image/jpeg", 11 * 1024 * 1024);
    const result = validateImageFile(file);
    expect(result.ok).toBe(false);
  });

  it("accepts PNG", () => {
    const file = makeFile("img.png", "image/png", 512);
    expect(validateImageFile(file).ok).toBe(true);
  });
});
