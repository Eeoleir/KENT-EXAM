"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { AdminData } from "../types";

export function useAdminData() {
  const [data, setData] = useState<AdminData>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api
      .get("/admin")
      .then((r: { data: AdminData }) => {
        if (!mounted) return;
        setData(r.data);
        setError(null);
      })
      .catch((e: { response?: { status?: number } }) => {
        if (!mounted) return;
        if (e?.response?.status === 401 || e?.response?.status === 403) {
          setData(null);
          setError(null);
        } else {
          setError("Failed to load admin data");
        }
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  return { data, error, loading };
}
