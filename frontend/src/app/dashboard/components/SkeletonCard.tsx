"use client";

export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
      <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
      <div className="h-3 w-1/2 rounded bg-gray-200"></div>
    </div>
  );
}
