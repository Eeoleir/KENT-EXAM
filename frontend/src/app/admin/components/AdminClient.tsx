"use client";
import { useAdminData } from "../hooks/useAdminData";
import AdminHeader from "./AdminHeader";
import AdminLoading from "./AdminLoading";
import AdminError from "./AdminError";
import AdminUnauthorized from "./AdminUnauthorized";
import UsersTable from "./UsersTable";

export default function AdminClient() {
  const { data, error, loading } = useAdminData();

  if (loading) {
    return <AdminLoading />;
  }

  if (error) {
    return <AdminError error={error} />;
  }

  if (!data) {
    return <AdminUnauthorized />;
  }

  return (
    <div className="mx-auto mt-12 max-w-5xl space-y-4 p-4 overflow-x-auto">
      <AdminHeader />
      <UsersTable users={data.users} />
    </div>
  );
}
