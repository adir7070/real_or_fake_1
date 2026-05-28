"use client";
import { ConfidenceBar } from "./ConfidenceBar";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export interface ProbabilityTableProps {
  probabilities: Record<"real" | "ai_generated", number>;
}

export function ProbabilityTable({ probabilities }: ProbabilityTableProps) {
  const { t } = useTranslation();
  const isRealHigher = probabilities.real >= probabilities.ai_generated;

  const rows = [
    {
      key: "real" as const,
      label: t("result.real"),
      value: probabilities.real,
      variant: "real" as const,
      bold: isRealHigher,
    },
    {
      key: "ai_generated" as const,
      label: t("result.ai"),
      value: probabilities.ai_generated,
      variant: "ai" as const,
      bold: !isRealHigher,
    },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{t("result.probabilities")}</p>
      {rows.map((row) => (
        <div key={row.key} className={cn("flex items-center gap-2", row.bold && "font-semibold")}>
          <span className="w-16 shrink-0 text-sm">{row.label}</span>
          <ConfidenceBar value={row.value} variant={row.variant} showPercentage />
        </div>
      ))}
    </div>
  );
}
