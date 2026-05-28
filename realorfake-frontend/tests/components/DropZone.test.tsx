import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DropZone } from "@/components/detector/DropZone";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import type { ReactNode } from "react";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>;
}

describe("DropZone", () => {
  it("renders the upload title text", () => {
    render(
      <Wrapper>
        <DropZone onAccepted={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getByText("גרור או בחר תמונה")).toBeInTheDocument();
  });

  it("renders an input of type file", () => {
    const { container } = render(
      <Wrapper>
        <DropZone onAccepted={vi.fn()} />
      </Wrapper>
    );
    const input = container.querySelector("input[type=file]");
    expect(input).toBeTruthy();
  });

  it("does not call onAccepted in disabled state", () => {
    const onAccepted = vi.fn();
    render(
      <Wrapper>
        <DropZone onAccepted={onAccepted} disabled />
      </Wrapper>
    );
    expect(onAccepted).not.toHaveBeenCalled();
  });
});
