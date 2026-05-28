"use client";
import { useQuery } from "@tanstack/react-query";
import { getModelInfo } from "@/lib/api/model";

export function useModelInfo() {
  return useQuery({
    queryKey: ["model-info"],
    queryFn: ({ signal }) => getModelInfo(signal),
    staleTime: 5 * 60_000,
  });
}
