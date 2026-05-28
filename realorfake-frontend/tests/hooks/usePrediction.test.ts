import { describe, it, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { usePrediction } from "@/lib/hooks/usePrediction";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return createElement(
    LocaleProvider,
    null,
    createElement(QueryClientProvider, { client: qc }, children)
  );
}

function makeFile(name = "test.jpg"): File {
  return new File([new Uint8Array(100)], name, { type: "image/jpeg" });
}

describe("usePrediction", () => {
  it("returns a PredictionResult on success", async () => {
    const { result } = renderHook(() => usePrediction(), { wrapper });
    act(() => {
      result.current.mutate({ file: makeFile() });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const data = result.current.data!;
    expect(data.label).toBe("ai_generated");
    expect(data.confidence).toBeCloseTo(0.97);
  });

  it("surfaces an ApiException with code on 4xx response", async () => {
    server.use(
      http.post("http://localhost:8000/api/predict", () =>
        HttpResponse.json(
          { error: "Invalid file", detail: null, code: "INVALID_FILE" },
          { status: 422 }
        )
      )
    );

    const { result } = renderHook(() => usePrediction(), { wrapper });
    act(() => {
      result.current.mutate({ file: makeFile() });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const err = result.current.error as { code: string };
    expect(err.code).toBe("INVALID_FILE");
  });
});
