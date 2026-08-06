import { Skeleton } from "@/components/ui/skeleton";

export function AnimalShowcaseSkeleton({
  cards = 8,
  showFilters = true,
}: {
  cards?: number;
  showFilters?: boolean;
}) {
  return (
    <div aria-hidden="true">
      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4 md:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border bg-surface">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-3 p-4">
              <div className="flex justify-between gap-3">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="h-3 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
