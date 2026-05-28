"use client";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/lib/hooks/useCopyToClipboard";

interface CopyableHashProps {
  value: string;
  truncateLength?: number;
}

export function CopyableHash({ value, truncateLength = 12 }: CopyableHashProps) {
  const { copy, copied } = useCopyToClipboard();
  const truncated = value.length > truncateLength ? `${value.slice(0, truncateLength)}…` : value;

  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm">
      <span title={value}>{truncated}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => copy(value)}
        aria-label={copied ? "הועתק" : "העתק"}
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}
