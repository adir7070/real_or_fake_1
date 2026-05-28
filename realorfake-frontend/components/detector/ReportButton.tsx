"use client";
import { useState } from "react";
import { useReport } from "@/lib/hooks/useReport";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { PredictionResult } from "@/lib/api/types";
import { useLocale } from "@/lib/i18n/locale-context";

export interface ReportButtonProps {
  prediction: PredictionResult;
  originalImageBase64: string;
  filename?: string;
}

export function ReportButton({ prediction, originalImageBase64, filename }: ReportButtonProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const report = useReport();

  async function handleDownload() {
    await report.mutateAsync({
      prediction,
      original_image_base64: originalImageBase64,
      filename,
      notes: notes || null,
      locale,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">{t("result.report.download")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("result.report.download")}</DialogTitle>
          <DialogDescription>הוסף הערות אופציונליות לדוח (עד 2000 תווים)</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="report-notes">הערות (אופציונלי)</Label>
          <Textarea
            id="report-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="הוסף הערות לדוח..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleDownload} disabled={report.isPending}>
            {report.isPending ? <LoadingSpinner size="sm" className="me-2" /> : null}
            הורד
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
