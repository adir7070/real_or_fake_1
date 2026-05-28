"use client";
import type { BatchPredictionResponse } from "@/lib/api/types";
import { BatchItemRow } from "./BatchItemRow";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface BatchListProps {
  response: BatchPredictionResponse;
}

export function BatchList({ response }: BatchListProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("batch.summary", {
          successful: response.successful,
          total: response.total,
        })}
      </p>
      {response.results.map((result, i) => (
        <BatchItemRow
          key={i}
          filename={`תמונה ${i + 1}`}
          label={result.label}
          confidence={result.confidence}
        />
      ))}
      {response.errors.map((err) => (
        <BatchItemRow
          key={`err-${err.index}`}
          filename={err.filename ?? `קובץ ${err.index + 1}`}
          errorCode={err.code}
        />
      ))}
    </div>
  );
}
