"use client";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { urlToFile } from "@/lib/utils/image";

const samples = [
  { src: "/samples/real_01.jpg", label: "real" as const, name: "real_01.jpg" },
  { src: "/samples/real_02.jpg", label: "real" as const, name: "real_02.jpg" },
  { src: "/samples/fake_01.jpg", label: "ai_generated" as const, name: "fake_01.jpg" },
  { src: "/samples/fake_02.jpg", label: "ai_generated" as const, name: "fake_02.jpg" },
];

interface SampleGalleryProps {
  onSelect: (file: File) => void;
}

export function SampleGallery({ onSelect }: SampleGalleryProps) {
  const { t } = useTranslation();

  async function handleClick(sample: (typeof samples)[0]) {
    const file = await urlToFile(sample.src, sample.name);
    onSelect(file);
  }

  return (
    <div className="mt-6">
      <p className="mb-3 text-sm font-medium text-muted-foreground">{t("detect.sample.title")}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {samples.map((sample) => (
          <button
            key={sample.src}
            onClick={() => handleClick(sample)}
            className="group overflow-hidden rounded-lg border transition-all hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`טען תמונת דוגמה: ${sample.name}`}
          >
            <Image
              src={sample.src}
              alt={sample.name}
              width={200}
              height={150}
              className="h-24 w-full object-cover transition-transform group-hover:scale-105"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
}
