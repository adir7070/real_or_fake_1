"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/format";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface BatchItemRowProps {
  filename: string;
  label?: "real" | "ai_generated";
  confidence?: number;
  errorCode?: string;
  thumbnailUrl?: string;
}

export function BatchItemRow({
  filename,
  label,
  confidence,
  errorCode,
  thumbnailUrl,
}: BatchItemRowProps) {
  const { t } = useTranslation();
  const hasError = Boolean(errorCode);

  return (
    <Card className={cn("overflow-hidden", hasError && "border-destructive/50")}>
      <CardContent className="flex items-center gap-4 p-3">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt={filename}
            className="h-12 w-12 rounded object-cover"
          />
        )}
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium">{filename}</p>
          {hasError && <p className="text-xs text-destructive">{errorCode}</p>}
        </div>
        {!hasError && label && (
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              style={{
                backgroundColor: label === "real" ? "hsl(142 70% 38%)" : "hsl(355 78% 50%)",
                color: "white",
                border: "none",
              }}
            >
              {label === "real" ? t("result.real") : t("result.ai")}
            </Badge>
            {confidence !== undefined && (
              <span className="text-sm tabular-nums">{formatPercent(confidence)}</span>
            )}
          </div>
        )}
        {hasError && (
          <Badge variant="destructive" className="shrink-0">
            שגיאה
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
