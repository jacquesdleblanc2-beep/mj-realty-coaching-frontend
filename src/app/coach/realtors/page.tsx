"use client";

// src/app/coach/realtors/page.tsx — Coach's realtor roster

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { getCoachRealtors, deleteRealtor, Realtor } from "@/lib/api";
import { useCoachId } from "@/lib/useCoachId";

function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function CoachRealtorsPage() {
  const { status }                    = useSession();
  const router                        = useRouter();
  const coachId                       = useCoachId();
  const [realtors,  setRealtors]  = useState<Realtor[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting,  setDeleting]  = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteRealtor(id);
      setRealtors((prev) => prev.filter((r) => r.id !== id));
      setConfirmId(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (coachId === null) return; // still resolving

    getCoachRealtors(coachId)
      .then(setRealtors)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [status, coachId, router]);

  if (status === "loading" || (status === "authenticated" && coachId === null) || loading) {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-medium text-teal-800">My Realtors</h1>
          <Link
            href="/coach/add"
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium
                       px-5 py-2.5 rounded-xl transition-colors"
          >
            + Add Realtor®
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Confirm dialog */}
        {confirmId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl border border-teal-200 shadow-lg p-6 max-w-sm w-full mx-4">
              <p className="text-sm font-semibold text-teal-800 mb-1">Delete realtor?</p>
              <p className="text-sm text-teal-500 mb-5">This data will be lost forever and cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmId)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {realtors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-teal-400">
            <p className="text-sm mb-3">No realtors yet.</p>
            <Link href="/coach/add" className="text-sm text-orange-500 hover:text-orange-600 underline underline-offset-2">
              Add your first realtor →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-3xl">
            {realtors.map((r) => {
              const lastPct = r.score_history?.at(-1)?.percentage ?? null;
              return (
                <div key={r.id} className="flex items-center gap-2">
                  <Link
                    href={`/coach/realtors/${r.id}`}
                    className="flex-1 bg-white border border-teal-200 rounded-xl p-5 flex items-center gap-5
                               hover:shadow-md cursor-pointer transition-shadow"
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-bold">{initials(r.name)}</span>
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-teal-800 truncate">{r.name}</p>
                      <p className="text-xs text-teal-400 truncate">{r.email}</p>
                    </div>

                    {/* Focus badge */}
                    {r.coaching_focus && (
                      <span className="text-xs bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full shrink-0 hidden sm:block">
                        {r.coaching_focus}
                      </span>
                    )}

                    {/* Score */}
                    <div className="text-right shrink-0">
                      {lastPct !== null ? (
                        <p className="text-sm font-semibold text-teal-800">{lastPct}%</p>
                      ) : (
                        <p className="text-xs text-teal-300">No data yet</p>
                      )}
                    </div>

                    <span className="text-teal-300 text-sm shrink-0">→</span>
                  </Link>

                  <button
                    onClick={() => setConfirmId(r.id)}
                    className="text-teal-200 hover:text-red-500 transition-colors p-2 shrink-0 text-lg"
                    aria-label="Delete realtor"
                    title="Delete realtor"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
