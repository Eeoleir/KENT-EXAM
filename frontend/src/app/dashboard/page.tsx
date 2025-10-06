import { cookies } from "next/headers";
import DashboardClient from "../_components/DashboardClient";

async function fetchMe() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const res = await fetch(
    (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000/api") +
      "/auth/me",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
      credentials: "include" as RequestInit["credentials"],
    }
  );
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardPage() {
  const me = await fetchMe();
  if (!me) {
    return (
      <div className="mx-auto mt-12 max-w-2xl p-6">
        <h1 className="mb-3 text-2xl font-semibold">Dashboard</h1>
        <p>You are not signed in.</p>
        <nav className="mt-3 flex gap-3">
          <a className="text-blue-700 underline" href="/login">
            Sign in
          </a>
          <a className="text-blue-700 underline" href="/register">
            Register
          </a>
        </nav>
      </div>
    );
  }
  return <DashboardClient initialMe={me} />;
}
