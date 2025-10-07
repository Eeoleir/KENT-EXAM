"use client";
import { AdminUser } from "../types";

interface UsersTableProps {
  users: AdminUser[];
}

export default function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="border-b px-4 py-2">ID</th>
            <th className="border-b px-4 py-2">Email</th>
            <th className="border-b px-4 py-2">Role</th>
            <th className="border-b px-4 py-2">Active</th>
            <th className="border-b px-4 py-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2">{u.id}</td>
              <td className="px-4 py-2">{u.email}</td>
              <td className="px-4 py-2">{u.role}</td>
              <td className="px-4 py-2">
                {u.isActive ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800">
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                {new Date(u.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
