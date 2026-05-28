import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ResultCard } from "@/components/detector/ResultCard";
import { fixturePrediction } from "../mocks/fixtures";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}

describe("ResultCard", () => {
  it("renders 'אמיתי' badge when label is real", () => {
    const result = fixturePrediction("real", 0.92);
    render(
      <Wrapper>
        <ResultCard result={result} onReset={vi.fn()} onDownloadReport={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getAllByText("אמיתי").length).toBeGreaterThanOrEqual(1);
  });

  it("renders 'AI' badge when label is ai_generated", () => {
    const result = fixturePrediction("ai_generated", 0.97);
    render(
      <Wrapper>
        <ResultCard result={result} onReset={vi.fn()} onDownloadReport={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getAllByText("AI").length).toBeGreaterThanOrEqual(1);
  });

  it("renders confidence as percentage with one decimal", () => {
    const result = fixturePrediction("real", 0.923);
    render(
      <Wrapper>
        <ResultCard result={result} onReset={vi.fn()} onDownloadReport={vi.fn()} />
      </Wrapper>
    );
    expect(screen.getAllByText("92.3%").length).toBeGreaterThanOrEqual(1);
  });

  it("calls onReset when 'תמונה חדשה' is clicked", () => {
    const onReset = vi.fn();
    const result = fixturePrediction("real", 0.9);
    render(
      <Wrapper>
        <ResultCard result={result} onReset={onReset} onDownloadReport={vi.fn()} />
      </Wrapper>
    );
    fireEvent.click(screen.getByText("תמונה חדשה"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
