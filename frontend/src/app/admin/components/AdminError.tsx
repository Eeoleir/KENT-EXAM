"use client";
import Link from "next/link";

interface AdminErrorProps {
  error: string;
}

export default function AdminError({ error }: AdminErrorProps) {
  return (
    <div className="mx-auto mt-12 max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-2 text-2xl font-semibold">Admin</h1>
      <p className="mb-3 text-red-600">{error}</p>
      <p>
        <Link className="text-blue-700 underline" href="/">
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}
