
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 animate-pulse">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-3">
        <div className="flex flex-col gap-6 md:col-span-1">
          <div className="flex flex-col gap-6 rounded-lg border bg-card p-4">
              <div className="w-full">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex-1 space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col gap-2 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-5 w-4/5" />
                        <div className="flex justify-between text-xs">
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                ))}
              </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 md:col-span-2">
            <div className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <div className="border rounded-lg p-4 space-y-2">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-4 w-1/3" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <div className="border rounded-lg p-4 space-y-3">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                         <div className="mt-2 space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="border rounded-lg p-4">
                                     <div className="ml-6 space-y-2">
                                        <Skeleton className="h-5 w-1/3" />
                                        <Skeleton className="h-4 w-2/3" />
                                     </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
