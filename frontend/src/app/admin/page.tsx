import { cookies } from "next/headers";
import Link from "next/link";

async function fetchAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const res = await fetch(
    (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api") +
      "/admin",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
      credentials: "include" as RequestInit["credentials"],
    }
  );
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Failed to load admin data");
  return res.json() as Promise<{
    users: Array<{
      id: number;
      email: string;
      role: "USER" | "ADMIN";
      isActive: boolean;
      createdAt: string;
    }>;
  }>;
}

export default async function AdminPage() {
  const data = await fetchAdmin();
  if (!data)
    return (
      <div className="mx-auto mt-12 max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold">Admin</h1>
        <p className="mb-3 text-red-600">Unauthorized</p>
        <p>
          <Link className="text-blue-700 underline" href="/">
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    );
  return (
    <div className="mx-auto mt-12 max-w-5xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <Link className="text-blue-700 underline" href="/">
          ← Back to Dashboard
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
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
            {data.users.map((u) => (
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
    </div>
  );
}
