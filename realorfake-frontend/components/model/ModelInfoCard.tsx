"use client";

import type { ModelInfo } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumberShort, formatPercent, formatDateTime } from "@/lib/utils/format";

interface ModelInfoCardProps {
  info: ModelInfo;
}

export function ModelInfoCard({ info }: ModelInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי המודל</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="ארכיטקטורה" value={info.arch} />
          <Stat label="גודל קלט" value={`${info.input_size}px`} />
          <Stat label="התקן" value={info.device} />
          <Stat label="פרמטרים" value={formatNumberShort(info.parameters_total)} />
          <Stat
            label="ניתנים לאימון"
            value={formatNumberShort(info.parameters_trainable)}
          />
          <Stat
            label="נטען"
            value={formatDateTime(info.checkpoint_loaded_at)}
          />
        </div>

        {info.training_metrics && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-3 font-semibold">תוצאות אימון</p>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="דיוק"
                value={formatPercent(info.training_metrics.accuracy)}
                large
              />
              <Stat
                label="AUC"
                value={formatPercent(info.training_metrics.auc)}
                large
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={large ? "text-2xl font-bold text-primary" : "font-medium"}>
        {value}
      </p>
    </div>
  );
}
