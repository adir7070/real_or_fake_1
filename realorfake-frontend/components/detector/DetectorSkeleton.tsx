import { Skeleton } from "@/components/ui/skeleton";

export function DetectorSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Image area */}
      <Skeleton className="h-64 w-full rounded-xl" />
      {/* Result card */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );
}
