"use client";

// src/app/admin/feedback/page.tsx — Super-admin feedback inbox

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getFeedback, deleteFeedback, FeedbackEntry } from "@/lib/api";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

function Spinner() {
  return <div className="w-7 h-7 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function PagePill({ page }: { page: string }) {
  return (
    <span className="text-[10px] font-medium bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full
                     max-w-[160px] truncate shrink-0">
      {page}
    </span>
  );
}

function FeedbackRow({
  entry, onDelete,
}: {
  entry: FeedbackEntry;
  onDelete: (id: string) => void;
}) {
  const [open,    setOpen]    = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-colors
                     ${open ? "border-teal-300" : "border-teal-200"}`}>
      {/* Row */}
      <div
        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-teal-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-teal-800">{entry.name}</span>
            <PagePill page={entry.page} />
          </div>
          <p className="text-xs text-gray-500 truncate">{entry.message}</p>
        </div>
        <span className="text-xs text-teal-400 shrink-0 whitespace-nowrap">{fmtDate(entry.created_at)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirm(true); }}
          aria-label="Delete"
          className="text-teal-200 hover:text-red-500 transition-colors px-1 shrink-0 text-base"
        >
          🗑
        </button>
        <svg
          className={`w-4 h-4 text-teal-300 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Expanded message */}
      {open && (
        <div className="px-5 pb-5 border-t border-teal-100">
          <p className="text-sm text-gray-700 leading-relaxed pt-4 whitespace-pre-wrap">{entry.message}</p>
        </div>
      )}

      {/* Confirm delete overlay */}
      {confirm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-teal-200 shadow-lg p-6 max-w-sm w-full mx-4">
            <p className="text-sm text-teal-800 mb-5">
              Delete this feedback from <strong>{entry.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(false)}
                className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirm(false); onDelete(entry.id); }}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, email]);

  async function load() {
    setLoading(true); setError(null);
    try { setEntries(await getFeedback()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    try {
      await deleteFeedback(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-teal-50 flex items-center justify-center"><Spinner /></div>;
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin" className="text-sm text-teal-400 hover:text-teal-600 transition-colors">← Admin</a>
          <span className="text-teal-200">|</span>
          <span className="font-semibold text-teal-800 text-sm">Feedback Inbox</span>
        </div>
      </header>

      <div className="p-8 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-teal-800">Feedback Inbox</h1>
            {!loading && (
              <p className="text-xs text-teal-400 mt-0.5">{entries.length} submission{entries.length !== 1 ? "s" : ""}</p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="border border-teal-200 text-teal-600 hover:bg-teal-50 disabled:opacity-50
                       text-xs font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : entries.length === 0 ? (
          <div className="bg-white border border-teal-200 rounded-xl px-6 py-10 text-center">
            <p className="text-teal-400 text-sm">No feedback submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <FeedbackRow key={e.id} entry={e} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
