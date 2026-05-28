import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ConfidenceBar } from "@/components/detector/ConfidenceBar";

describe("ConfidenceBar", () => {
  it("renders with a progressbar role", () => {
    render(<ConfidenceBar value={0.75} variant="real" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toBeInTheDocument();
  });

  it("shows percentage label when showPercentage is true", () => {
    render(<ConfidenceBar value={0.75} variant="real" showPercentage />);
    expect(screen.getByText("75.0%")).toBeInTheDocument();
  });

  it("applies real variant style", () => {
    const { container } = render(<ConfidenceBar value={0.8} variant="real" />);
    const bar = container.querySelector("[role=progressbar]");
    expect(bar?.className).toContain("142");
  });

  it("applies ai variant style", () => {
    const { container } = render(<ConfidenceBar value={0.8} variant="ai" />);
    const bar = container.querySelector("[role=progressbar]");
    expect(bar?.className).toContain("355");
  });

  it("animates width to value * 100 after mount", async () => {
    const { container } = render(<ConfidenceBar value={0.65} variant="real" />);
    const bar = container.querySelector("[role=progressbar]") as HTMLElement;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });
    expect(bar.style.width).toBe("65%");
  });
});
