"use client";
import type { PredictionResult } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProbabilityTable } from "./ProbabilityTable";
import { ReportButton } from "./ReportButton";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { useDetectionStore } from "@/lib/store/detection-store";
import { formatPercent, formatMs } from "@/lib/utils/format";

export interface ResultCardProps {
  result: PredictionResult;
  filename?: string;
  onReset: () => void;
  onDownloadReport: () => void;
}

export function ResultCard({ result, filename, onReset }: ResultCardProps) {
  const { t } = useTranslation();
  const { currentImageBase64 } = useDetectionStore();
  const isReal = result.label === "real";

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              className="px-3 py-1 text-base font-bold"
              style={{
                backgroundColor: isReal ? "hsl(142 70% 38%)" : "hsl(355 78% 50%)",
                color: "white",
                border: "none",
              }}
            >
              {isReal ? t("result.real") : t("result.ai")}
            </Badge>
            <span className="text-2xl font-bold tabular-nums">
              {formatPercent(result.confidence)}
            </span>
            <span className="text-sm text-muted-foreground">{t("result.confidence")}</span>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{t("result.model")}: {result.model_arch}</span>
          <span>{result.input_size}px</span>
          <span>{t("result.inference_time")}: {formatMs(result.inference_ms)}</span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ProbabilityTable probabilities={result.probabilities} />

        <Separator />

        <div className="flex flex-wrap gap-2">
          {currentImageBase64 && (
            <ReportButton
              prediction={result}
              originalImageBase64={currentImageBase64}
              filename={filename}
            />
          )}
          <Button variant="outline" onClick={onReset}>
            {t("result.new")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
