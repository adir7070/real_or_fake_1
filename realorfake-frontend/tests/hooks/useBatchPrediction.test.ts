import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useBatchPrediction } from "@/lib/hooks/useBatchPrediction";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return createElement(QueryClientProvider, { client: qc }, children);
}

function makeFile(name: string): File {
  return new File([new Uint8Array(100)], name, { type: "image/jpeg" });
}

describe("useBatchPrediction", () => {
  it("returns a batch response with two items on success", async () => {
    const { result } = renderHook(() => useBatchPrediction(), { wrapper });
    result.current.mutate({ files: [makeFile("a.jpg"), makeFile("b.jpg")] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.results).toHaveLength(2);
    expect(data.successful).toBe(2);
  });
});
