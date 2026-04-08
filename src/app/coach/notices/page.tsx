"use client";

// src/app/coach/notices/page.tsx — Coach notices

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { clearNoticesCache } from "@/lib/useNotices";
import { useCoachId } from "@/lib/useCoachId";
import { getNotices, patchNoticeRead, Notice } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function Spinner() {
  return <div className="w-7 h-7 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function NoticeCard({
  notice, read, onToggleRead,
}: {
  notice: Notice;
  read: boolean;
  onToggleRead: (id: string, read: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors
                     ${read ? "border-teal-100" : "border-teal-300"}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-teal-50 transition-colors"
      >
        {read && (
          <svg className="w-4 h-4 text-teal-300 shrink-0" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className={`flex-1 text-sm font-semibold ${read ? "text-teal-400" : "text-teal-800"}`}>
          {notice.title}
        </span>
        <span className="text-xs text-teal-400 shrink-0">{fmtDate(notice.created_at)}</span>
        <svg
          className={`w-4 h-4 text-teal-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-teal-100">
          <div className="pt-4 space-y-2">
            {notice.body.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-teal-700 leading-relaxed">{line}</p>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            {!read ? (
              <button
                onClick={() => onToggleRead(notice.id, true)}
                className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white
                           text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Mark as read ✓
              </button>
            ) : (
              <button
                onClick={() => onToggleRead(notice.id, false)}
                className="flex items-center gap-1.5 border border-teal-200 text-teal-500
                           hover:bg-teal-50 text-xs font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Mark as unread
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachNoticesPage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const coachId = useCoachId();

  const [notices, setNotices] = useState<Notice[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !coachId) return;
    (async () => {
      try {
        const [noticesData, profileRes] = await Promise.all([
          getNotices("coaches"),
          fetch(`${BASE}/api/coaches/${encodeURIComponent(coachId)}`),
        ]);
        setNotices(noticesData);
        if (profileRes.ok) {
          const profile = await profileRes.json();
          setReadIds(profile?.read_notices ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [status, coachId]);

  // Wait for coachId to resolve
  useEffect(() => {
    if (status === "authenticated" && coachId === null) {
      const t = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(t);
    }
  }, [status, coachId]);

  const handleToggleRead = useCallback(async (noticeId: string, read: boolean) => {
    if (!coachId) return;
    try {
      const res = await patchNoticeRead(coachId, "coach", noticeId, read);
      setReadIds(res.read_notices);
      clearNoticesCache();
    } catch { /* silent */ }
  }, [coachId]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const unread = notices.filter((n) => !readIds.includes(n.id));
  const read   = notices.filter((n) => readIds.includes(n.id));

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-medium text-teal-800">Notices</h1>
            <p className="text-sm text-teal-400 mt-1">Platform updates from admin</p>
          </div>
          {unread.length > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 font-medium px-3 py-1.5 rounded-full">
              {unread.length} unread
            </span>
          )}
        </div>

        {notices.length === 0 ? (
          <div className="bg-white border border-teal-200 rounded-xl px-6 py-10 text-center max-w-xl">
            <p className="text-teal-400 text-sm">No notices yet. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {unread.length > 0 && (
              <>
                <p className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-2">Unread</p>
                {unread.map((n) => (
                  <NoticeCard key={n.id} notice={n} read={false} onToggleRead={handleToggleRead} />
                ))}
              </>
            )}
            {read.length > 0 && (
              <>
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider mt-6 mb-2">Read</p>
                {read.map((n) => (
                  <NoticeCard key={n.id} notice={n} read={true} onToggleRead={handleToggleRead} />
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
