"use client";
import { User } from "../types";

interface UserInfoProps {
  user: User;
}

export default function UserInfo({ user }: UserInfoProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">Signed in as</p>
      <p className="text-lg font-semibold text-gray-900">{user.email}</p>
      <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
        Role:
        <span className="uppercase text-gray-800">{user.role}</span>
      </p>
    </div>
  );
}
