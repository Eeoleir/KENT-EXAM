"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { User } from "../types";

export function useAuth(initialMe: User | null) {
  const [me, setMe] = useState<User | null>(initialMe);
  const [isLoading, setIsLoading] = useState(!initialMe);

  useEffect(() => {
    if (!initialMe) {
      setIsLoading(true);
    }
    api
      .get("/auth/me")
      .then((r: { data: User }) => setMe(r.data))
      .catch(() => setMe(null))
      .finally(() => setIsLoading(false));
  }, [initialMe]);

  const logout = () => {
    setMe(null);
    setIsLoading(false);
  };

  return { me, isLoading, logout };
}
