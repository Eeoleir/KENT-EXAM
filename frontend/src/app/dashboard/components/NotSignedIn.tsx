"use client";
import Link from "next/link";

export default function NotSignedIn() {
  return (
    <div className="mx-auto max-w-sm rounded-lg border bg-white p-6 text-center shadow-sm">
      <p className="mb-3">You are not signed in.</p>
      <div className="flex justify-center gap-3">
        <Link
          className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
          href="/login"
        >
          Sign in
        </Link>
        <Link
          className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
          href="/register"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
