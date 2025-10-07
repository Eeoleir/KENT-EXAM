"use client";
import { useEffect, useState, useRef } from "react";
import { api } from "../../../lib/api";
import { User, SubscriptionStatus } from "../types";

export function useSubscription(me: User | null) {
  const [active, setActive] = useState<SubscriptionStatus>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    if (!me) {
      setActive(null);
      hasLoadedData.current = false;
      return;
    }

    // Only load data once per user session
    if (hasLoadedData.current) {
      return;
    }

    setIsLoadingSubscription(true);
    api
      .get("/billing/status")
      .then((r: { data?: { active?: boolean } }) => setActive(!!r.data?.active))
      .catch(() => setActive(false))
      .finally(() => {
        setIsLoadingSubscription(false);
        hasLoadedData.current = true;
      });
  }, [me]);

  return {
    active,
    isLoadingSubscription,
  };
}
