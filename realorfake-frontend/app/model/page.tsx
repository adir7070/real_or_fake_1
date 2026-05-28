"use client";
import { useModelInfo } from "@/lib/hooks/useModelInfo";
import { ModelInfoCard } from "@/components/model/ModelInfoCard";
import { ConfusionMatrixView } from "@/components/model/ConfusionMatrixView";
import { CrossGeneratorChart } from "@/components/model/CrossGeneratorChart";
import { JpegRobustnessChart } from "@/components/model/JpegRobustnessChart";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function ModelPage() {
  const { data, isLoading, isError, error, refetch } = useModelInfo();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <ErrorMessage
        title={t("common.error")}
        description={(error as Error)?.message ?? t("errors.UNKNOWN")}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">{t("model.title")}</h1>
      <ModelInfoCard info={data} />
      {data.training_metrics?.confusion_matrix && (
        <ConfusionMatrixView matrix={data.training_metrics.confusion_matrix} />
      )}
      {data.cross_generator_results.length > 0 && (
        <CrossGeneratorChart results={data.cross_generator_results} />
      )}
      {Object.keys(data.jpeg_robustness).length > 0 && (
        <JpegRobustnessChart data={data.jpeg_robustness} />
      )}
    </div>
  );
}
