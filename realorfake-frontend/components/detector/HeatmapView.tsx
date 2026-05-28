"use client";
import Image from "next/image";
import { base64ToDataUrl } from "@/lib/utils/image";
import type { View } from "@/lib/store/detection-store";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface HeatmapViewProps {
  previewUrl: string; // object URL of original
  heatmapBase64: string | null;
  view: View;
}

export function HeatmapView({ previewUrl, heatmapBase64, view }: HeatmapViewProps) {
  const { t } = useTranslation();
  const heatmapDataUrl = heatmapBase64 ? base64ToDataUrl(heatmapBase64) : null;

  const isDataUri = previewUrl.startsWith("data:");

  const OriginalImage = () => (
    <figure className="flex flex-col items-center gap-1">
      {isDataUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt={t("result.view.original")}
          className="max-h-96 w-full max-w-lg rounded-lg object-contain"
        />
      ) : (
        <Image
          src={previewUrl}
          alt={t("result.view.original")}
          width={512}
          height={512}
          className="max-h-96 w-full max-w-lg rounded-lg object-contain"
          unoptimized
        />
      )}
      <figcaption className="text-xs text-muted-foreground">{t("result.view.original")}</figcaption>
    </figure>
  );

  const HeatmapImage = () =>
    heatmapDataUrl ? (
      <figure className="flex flex-col items-center gap-1">
        {/* data: URIs don't work well with next/image, use plain img */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heatmapDataUrl}
          alt={t("result.view.heatmap")}
          className="max-h-96 w-full max-w-lg rounded-lg object-contain"
        />
        <figcaption className="text-xs text-muted-foreground">
          {t("result.view.heatmap")}
        </figcaption>
      </figure>
    ) : (
      <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Heatmap לא זמין
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-2xl">
      {view === "original" && <OriginalImage />}
      {view === "heatmap" && <HeatmapImage />}
      {view === "side-by-side" && (
        <div className="grid grid-cols-2 gap-4">
          <OriginalImage />
          <HeatmapImage />
        </div>
      )}
    </div>
  );
}
