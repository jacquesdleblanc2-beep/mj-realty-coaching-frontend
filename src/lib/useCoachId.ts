"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getCoachByEmail } from "./api";

export function useCoachId(): string | null {
  const { data: session, status } = useSession();
  const [coachId, setCoachId] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Try sessionStorage first (fast)
    const stored = sessionStorage.getItem("coachId");
    if (stored) { setCoachId(stored); return; }

    // Fall back to API lookup (on refresh/direct link)
    const email = session?.user?.email ?? "";
    if (!email) return;
    getCoachByEmail(email).then((coach) => {
      if (coach) {
        sessionStorage.setItem("coachId", coach.id);
        setCoachId(coach.id);
      }
    });
  }, [status, session]);

  return coachId;
}
