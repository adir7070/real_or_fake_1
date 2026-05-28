"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/format";

export interface ConfidenceBarProps {
  value: number; // 0..1
  label?: string;
  variant: "real" | "ai";
  showPercentage?: boolean;
}

export function ConfidenceBar({ value, label, variant, showPercentage = true }: ConfidenceBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth(value * 100), 50);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-24 shrink-0 text-sm">{label}</span>}
      <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variant === "real" ? "bg-[hsl(142_70%_38%)]" : "bg-[hsl(355_78%_50%)]"
          )}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={Math.round(value * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showPercentage && (
        <span className="w-14 shrink-0 text-end text-sm tabular-nums">{formatPercent(value)}</span>
      )}
    </div>
  );
}
