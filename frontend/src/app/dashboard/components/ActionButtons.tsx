"use client";
import Link from "next/link";
import { User } from "../types";

interface ActionButtonsProps {
  user: User;
  onLogout: () => void;
  showAdmin?: boolean;
  showLogout?: boolean;
}

export default function ActionButtons({
  user,
  onLogout,
  showAdmin = true,
  showLogout = true,
}: ActionButtonsProps) {
  return (
    <div className="mt-4 flex gap-3">
      {showAdmin && user.role === "ADMIN" && (
        <Link
          className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
          href="/admin"
        >
          Admin
        </Link>
      )}
      {showLogout && (
        <button
          className="rounded border bg-white px-3 py-1 shadow-sm hover:underline"
          onClick={onLogout}
        >
          Logout
        </button>
      )}
    </div>
  );
}
