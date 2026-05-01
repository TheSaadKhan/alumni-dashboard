import { Skeleton } from "@/components/ui/skeleton";

// ─── Shared Card Skeleton ────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-1/3 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-lg" />
        <Skeleton className="h-3 w-5/6 rounded-lg" />
      </div>
      <div className="flex gap-3 pt-2 border-t border-slate-50">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Stats Row Skeleton ───────────────────────────────────────────────────────
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-14 rounded-lg" />
            <Skeleton className="h-3 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page Header Skeleton ─────────────────────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>
      <Skeleton className="h-11 w-36 rounded-xl" />
    </div>
  );
}

// ─── Grid of Cards Skeleton ───────────────────────────────────────────────────
export function GridSkeleton({ cols = 3, count = 6 }: { cols?: number; count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6`}>
      {Array(count).fill(0).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── Detail Page Skeleton (2-col layout) ─────────────────────────────────────
export function DetailPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-7 w-64 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page Skeleton ────────────────────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <Skeleton className="h-9 w-20 rounded-xl" />
      <div className="flex flex-col md:flex-row gap-8 pb-8 border-b border-slate-100">
        <Skeleton className="h-32 w-32 rounded-3xl shrink-0" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 rounded-xl" />
            <Skeleton className="h-5 w-40 rounded-lg" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0 divide-y divide-slate-50">
      {Array(rows).fill(0).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3 rounded-lg" />
            <Skeleton className="h-3 w-1/5 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
