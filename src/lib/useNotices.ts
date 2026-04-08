"use client";

// src/lib/useNotices.ts — Cached hook for unread notice count

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Module-level cache — persists for the lifetime of the page session
let _count:    number | null = null;
let _cacheKey: string        = "";

export function clearNoticesCache() {
  _count    = null;
  _cacheKey = "";
}

export function useNotices(role: "realtor" | "admin"): number {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(_count ?? 0);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    if (!email) return;
    const key = `${role}:${email}`;
    if (_count !== null && _cacheKey === key) return;

    (async () => {
      try {
        const audience = role === "realtor" ? "realtors" : "coaches";
        const table    = role === "realtor" ? "realtors" : "coaches";

        const [noticesRes, profileRes] = await Promise.all([
          fetch(`${BASE}/api/notices?audience=${audience}`),
          fetch(`${BASE}/api/${table}/by-email/${encodeURIComponent(email)}`),
        ]);

        if (!noticesRes.ok || !profileRes.ok) return;

        const notices: { id: string }[] = await noticesRes.json();
        const profile: { read_notices?: string[] } | null = await profileRes.json();
        const readIds = profile?.read_notices ?? [];

        const unread = notices.filter((n) => !readIds.includes(n.id)).length;
        _count    = unread;
        _cacheKey = key;
        setCount(unread);
      } catch {
        // silent
      }
    })();
  }, [status, session, role]);

  return count;
}
