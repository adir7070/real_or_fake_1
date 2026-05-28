"use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { View } from "@/lib/store/detection-store";

export interface HeatmapToggleProps {
  view: View;
  onChange: (v: View) => void;
}

export function HeatmapToggle({ view, onChange }: HeatmapToggleProps) {
  const { t } = useTranslation();
  return (
    <Tabs value={view} onValueChange={(v) => onChange(v as View)}>
      <TabsList>
        <TabsTrigger value="original">{t("result.view.original")}</TabsTrigger>
        <TabsTrigger value="heatmap">{t("result.view.heatmap")}</TabsTrigger>
        <TabsTrigger value="side-by-side">{t("result.view.both")}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
