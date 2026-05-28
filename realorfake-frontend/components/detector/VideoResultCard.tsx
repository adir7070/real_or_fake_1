"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatPercent } from "@/lib/utils/format";
import type { VideoPredictionResult, FrameResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Props {
  result: VideoPredictionResult;
  onReset: () => void;
}

function verdictColor(label: string) {
  return label === "real" ? "hsl(142 70% 38%)" : "hsl(355 78% 50%)";
}

function FrameTimeline({ frames }: { frames: FrameResult[] }) {
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-full">
      {frames.map((f, i) => (
        <div
          key={i}
          title={`${f.timestamp_s}s — ${f.label} (${formatPercent(f.confidence)})`}
          className="flex-1 transition-colors"
          style={{ backgroundColor: verdictColor(f.label) }}
        />
      ))}
    </div>
  );
}

export function VideoResultCard({ result, onReset }: Props) {
  const { t } = useTranslation();
  const isReal = result.label === "real";
  const labelText = isReal ? t("result.real") : t("result.ai");

  return (
    <Card className="animate-slide-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              className="px-3 py-1 text-base font-bold"
              style={{ backgroundColor: verdictColor(result.label), color: "white" }}
            >
              {labelText}
            </Badge>
            <span className="text-2xl font-bold tabular-nums">
              {formatPercent(result.confidence)}
            </span>
            <span className="text-sm text-muted-foreground">{t("result.confidence")}</span>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{result.frames_analyzed} {t("video.result.frames")}</span>
          <span>{result.duration_s}s {t("video.result.duration")}</span>
          <span>{t("result.model")}: {result.model_arch}</span>
          <span>{t("result.inference_time")}: {Math.round(result.inference_ms)} ms</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Timeline */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t("video.result.timeline")}</p>
          <FrameTimeline frames={result.frame_results} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0s</span>
            <span>{result.duration_s}s</span>
          </div>
        </div>

        <Separator />

        {/* Per-frame table */}
        <div className="space-y-1 max-h-52 overflow-y-auto">
          <p className="text-sm font-medium text-muted-foreground sticky top-0 bg-card pb-1">
            {t("video.result.timeline")}
          </p>
          <div className="grid grid-cols-3 gap-x-4 text-xs font-semibold text-muted-foreground pb-1">
            <span>{t("video.result.frame")}</span>
            <span>{t("video.result.timestamp")}</span>
            <span>{t("result.confidence")}</span>
          </div>
          {result.frame_results.map((f, i) => (
            <div
              key={i}
              className={cn(
                "grid grid-cols-3 gap-x-4 text-sm py-0.5 rounded px-1",
                f.label === "real" ? "text-[hsl(142_70%_38%)]" : "text-[hsl(355_78%_50%)]"
              )}
            >
              <span className="tabular-nums">#{i + 1}</span>
              <span className="tabular-nums">{f.timestamp_s}s</span>
              <span className="tabular-nums">{formatPercent(f.confidence)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <Button variant="outline" onClick={onReset}>
          {t("video.result.new")}
        </Button>
      </CardContent>
    </Card>
  );
}
