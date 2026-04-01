export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Controls bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-10 w-72 bg-muted rounded-lg" />
          <div className="h-10 w-20 bg-muted rounded-lg" />
          <div className="h-10 w-16 bg-muted rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg" />
      </div>

      {/* Breadcrumb skeleton */}
      <div className="h-6 w-24 bg-muted rounded" />

      {/* Treemap skeleton */}
      <div className="w-full h-[500px] bg-muted/30 rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">데이터 로딩 중...</span>
        </div>
      </div>
    </div>
  );
}
