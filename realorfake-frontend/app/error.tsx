"use client";
import { ErrorMessage } from "@/components/shared/ErrorMessage";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <ErrorMessage
        title="משהו השתבש"
        description={error.message}
        onRetry={reset}
      />
    </div>
  );
}
