"use client";
import Link from "next/link";

export default function AdminHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <Link className="text-blue-700 underline" href="/">
        ← Back to Dashboard
      </Link>
    </div>
  );
}
