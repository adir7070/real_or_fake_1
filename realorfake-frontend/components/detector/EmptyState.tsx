"use client";
import { ImageIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center text-muted-foreground">
      <ImageIcon className="h-16 w-16 opacity-30" />
      <p className="text-sm">{t("detect.upload.title")}</p>
    </div>
  );
}
