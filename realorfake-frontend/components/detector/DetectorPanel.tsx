"use client";
import { useRef, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDetectionStore } from "@/lib/store/detection-store";
import { usePrediction } from "@/lib/hooks/usePrediction";
import { usePredictionFromUrl } from "@/lib/hooks/usePredictionFromUrl";
import { useBatchPrediction } from "@/lib/hooks/useBatchPrediction";
import { useVideoPrediction } from "@/lib/hooks/useVideoPrediction";
import { fileToBase64 } from "@/lib/utils/image";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { DropZone } from "./DropZone";
import { URLInput } from "./URLInput";
import { SampleGallery } from "./SampleGallery";
import { ResultCard } from "./ResultCard";
import { HeatmapView } from "./HeatmapView";
import { HeatmapToggle } from "./HeatmapToggle";
import { BatchList } from "./BatchList";
import { DetectorSkeleton } from "./DetectorSkeleton";
import { ExplainerCallout } from "./ExplainerCallout";
import { VideoDropZone } from "./VideoDropZone";
import { VideoResultCard } from "./VideoResultCard";
import type { Mode } from "@/lib/store/detection-store";

export function DetectorPanel() {
  const { t } = useTranslation();
  const store = useDetectionStore();
  const abortRef = useRef<AbortController | null>(null);

  const prediction = usePrediction();
  const predictionFromUrl = usePredictionFromUrl();
  const batchPrediction = useBatchPrediction();
  const videoPrediction = useVideoPrediction();

  const isLoading =
    prediction.isPending ||
    predictionFromUrl.isPending ||
    batchPrediction.isPending ||
    videoPrediction.isPending;

  const handleFile = useCallback(
    async (file: File) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      store.setPreview(URL.createObjectURL(file), file);
      store.setResult(null);

      const b64 = await fileToBase64(file);
      store.setImageBase64(b64);

      prediction.mutate(
        { file, includeHeatmap: true },
        {
          onSuccess: (result) => {
            store.setResult(result);
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (store.mode === "single") {
        handleFile(files[0]);
      } else {
        store.setBatchResult(null);
        batchPrediction.mutate(
          { files, includeHeatmap: false },
          {
            onSuccess: (result) => {
              store.setBatchResult(result);
            },
          }
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.mode, handleFile]
  );

  const handleUrl = useCallback(
    (url: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      store.setPreview(url, null);
      store.setResult(null);

      predictionFromUrl.mutate(
        { url, include_heatmap: true },
        {
          onSuccess: (result) => {
            store.setResult(result);
          },
        }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleVideo = useCallback(
    (file: File) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      store.setVideoResult(null);
      videoPrediction.mutate(
        { file, signal: abortRef.current.signal },
        { onSuccess: (result) => store.setVideoResult(result) }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    store.reset();
    prediction.reset();
    predictionFromUrl.reset();
    batchPrediction.reset();
    videoPrediction.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (value: string) => {
    store.setMode(value as Mode);
    handleReset();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("nav.detect")}</h1>

      <Tabs value={store.mode} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="single">יחיד</TabsTrigger>
          <TabsTrigger value="batch">מרובה</TabsTrigger>
          <TabsTrigger value="url">קישור</TabsTrigger>
          <TabsTrigger value="video">וידאו</TabsTrigger>
        </TabsList>

        {/* Single mode */}
        <TabsContent value="single" className="mt-4">
          {!store.result && !isLoading && (
            <>
              <DropZone multiple={false} onAccepted={handleFiles} />
              <SampleGallery onSelect={(f) => handleFile(f)} />
            </>
          )}
          {isLoading && <DetectorSkeleton />}
          {store.result && store.previewUrl && (
            <div className="flex flex-col gap-4 animate-slide-up">
              <HeatmapToggle view={store.view} onChange={store.setView} />
              <HeatmapView
                previewUrl={store.previewUrl}
                heatmapBase64={store.result.heatmap_base64}
                view={store.view}
              />
              <ResultCard
                result={store.result}
                filename={store.currentFile?.name}
                onReset={handleReset}
                onDownloadReport={() => {}}
              />
              {store.result.heatmap_base64 && <ExplainerCallout />}
            </div>
          )}
        </TabsContent>

        {/* Batch mode */}
        <TabsContent value="batch" className="mt-4">
          {!store.batchResult && !isLoading && (
            <DropZone multiple onAccepted={handleFiles} />
          )}
          {isLoading && <DetectorSkeleton />}
          {store.batchResult && (
            <div className="animate-slide-up">
              <BatchList response={store.batchResult} />
              <button
                className="mt-4 text-sm text-muted-foreground underline hover:text-foreground"
                onClick={handleReset}
              >
                {t("result.new")}
              </button>
            </div>
          )}
        </TabsContent>

        {/* Video mode */}
        <TabsContent value="video" className="mt-4">
          {!store.videoResult && !isLoading && (
            <VideoDropZone onAccepted={handleVideo} />
          )}
          {isLoading && <DetectorSkeleton />}
          {store.videoResult && (
            <VideoResultCard result={store.videoResult} onReset={handleReset} />
          )}
        </TabsContent>

        {/* URL mode */}
        <TabsContent value="url" className="mt-4">
          <URLInput onAccepted={handleUrl} disabled={isLoading} />
          {isLoading && (
            <div className="mt-6">
              <DetectorSkeleton />
            </div>
          )}
          {store.result && store.previewUrl && (
            <div className="mt-6 flex flex-col gap-4 animate-slide-up">
              <HeatmapToggle view={store.view} onChange={store.setView} />
              <HeatmapView
                previewUrl={store.previewUrl}
                heatmapBase64={store.result.heatmap_base64}
                view={store.view}
              />
              <ResultCard
                result={store.result}
                onReset={handleReset}
                onDownloadReport={() => {}}
              />
              {store.result.heatmap_base64 && <ExplainerCallout />}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
