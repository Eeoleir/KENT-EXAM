"use client";
import Link from "next/link";

interface SubscriptionStatusProps {
  isActive: boolean | null;
  isLoading: boolean;
  onSubscribe: () => void;
}

const SkeletonCard = () => (
  <div className="animate-pulse rounded-lg border bg-white p-4 shadow-sm">
    <div className="mb-2 h-4 w-1/2 rounded bg-gray-200"></div>
    <div className="h-8 w-24 rounded bg-gray-200"></div>
  </div>
);

export default function SubscriptionStatus({
  isActive,
  isLoading,
  onSubscribe,
}: SubscriptionStatusProps) {
  if (isLoading) {
    return <SkeletonCard />;
  }

  if (isActive === false) {
    return (
      <div className="mt-3 rounded-lg border bg-white p-4 shadow-sm">
        <p className="mb-2 text-gray-700">Your account is not active.</p>
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={onSubscribe}
        >
          Subscribe
        </button>
      </div>
    );
  }

  if (isActive === true) {
    return (
      <div className="mt-4 rounded-lg border bg-white p-4 shadow-sm">
        <p className="mb-3 text-green-700">You are subscribed.</p>
        <Link className="text-blue-700 underline" href="/#videos">
          Video Library
        </Link>
      </div>
    );
  }

  return null;
}
