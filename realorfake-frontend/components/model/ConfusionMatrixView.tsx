"use client";

import type { ConfusionMatrix } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConfusionMatrixViewProps {
  matrix: ConfusionMatrix;
}

export function ConfusionMatrixView({ matrix }: ConfusionMatrixViewProps) {
  const { tn, fp, fn, tp } = matrix;
  const total = tn + fp + fn + tp;

  function cellBg(val: number): string {
    const intensity = Math.round((val / (total / 2)) * 100);
    const clamped = Math.min(intensity, 100);
    return `hsl(220 47% ${100 - clamped * 0.5}%)`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>מטריצת בלבול (test set)</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="mx-auto border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="p-3" />
              <th className="p-3 font-medium text-muted-foreground" colSpan={2}>
                חיזוי
              </th>
            </tr>
            <tr>
              <th className="p-3" />
              <th className="p-3 font-medium">real</th>
              <th className="p-3 font-medium">ai_generated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 font-medium text-muted-foreground [writing-mode:vertical-lr] rotate-180 text-xs">
                אמיתי: real
              </td>
              <td
                className="min-w-20 rounded-md p-4 font-bold"
                style={{ background: cellBg(tn) }}
              >
                TN={tn}
              </td>
              <td
                className="min-w-20 rounded-md p-4 font-bold"
                style={{ background: cellBg(fp) }}
              >
                FP={fp}
              </td>
            </tr>
            <tr>
              <td className="p-3 font-medium text-muted-foreground text-xs">
                ai_generated
              </td>
              <td
                className="min-w-20 rounded-md p-4 font-bold"
                style={{ background: cellBg(fn) }}
              >
                FN={fn}
              </td>
              <td
                className="min-w-20 rounded-md p-4 font-bold"
                style={{ background: cellBg(tp) }}
              >
                TP={tp}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
