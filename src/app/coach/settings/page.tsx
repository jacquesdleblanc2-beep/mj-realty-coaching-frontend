"use client";

// src/app/coach/settings/page.tsx — Coach account settings

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getCoachByEmail,
  getCoachRealtors,
  getRealtors,
  assignRealtorToCoach,
  removeRealtorFromCoach,
  Coach,
  Realtor,
} from "@/lib/api";

export default function CoachSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [coach, setCoach]                   = useState<Coach | null>(null);
  const [assigned, setAssigned]             = useState<Realtor[]>([]);
  const [allRealtors, setAllRealtors]       = useState<Realtor[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [addingId, setAddingId]             = useState<string | null>(null);
  const [removingId, setRemovingId]         = useState<string | null>(null);

  const INVITE_CODE = process.env.NEXT_PUBLIC_INVITE_CODE;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;

    const email = session?.user?.email ?? "";

    async function load() {
      try {
        let coachId = sessionStorage.getItem("coachId") ?? "";
        let coachData: Coach | null = null;

        if (!coachId) {
          coachData = await getCoachByEmail(email);
          if (!coachData) { router.push("/"); return; }
          coachId = coachData.id;
          sessionStorage.setItem("coachId", coachId);
        } else {
          coachData = await getCoachByEmail(email);
          if (!coachData) { router.push("/"); return; }
        }

        setCoach(coachData);
        const [assignedList, all] = await Promise.all([
          getCoachRealtors(coachId),
          getRealtors(),
        ]);
        setAssigned(assignedList);
        setAllRealtors(all);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }

    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  async function handleRemove(realtorId: string) {
    if (!coach) return;
    setRemovingId(realtorId);
    try {
      await removeRealtorFromCoach(coach.id, realtorId);
      setAssigned((prev) => prev.filter((r) => r.id !== realtorId));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAdd(realtorId: string) {
    if (!coach) return;
    setAddingId(realtorId);
    setShowAddDropdown(false);
    try {
      await assignRealtorToCoach(coach.id, realtorId);
      const realtor = allRealtors.find((r) => r.id === realtorId);
      if (realtor) setAssigned((prev) => [...prev, realtor]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAddingId(null);
    }
  }

  const assignedIds  = new Set(assigned.map((r) => r.id));
  const unassigned   = allRealtors.filter((r) => !assignedIds.has(r.id));

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto max-w-2xl">

        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">Settings</h1>
          <p className="text-sm text-teal-400 mt-1">Manage your coach account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Profile */}
        <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-teal-800 mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-teal-400 mb-1">Name</label>
              <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                {coach?.name ?? session?.user?.name ?? "—"}
              </p>
            </div>
            <div>
              <label className="block text-xs text-teal-400 mb-1">Email</label>
              <p className="text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                {coach?.email ?? session?.user?.email ?? "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Assigned realtors */}
        <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-teal-800">Assigned realtors</h2>
            <div className="relative">
              <button
                onClick={() => setShowAddDropdown((v) => !v)}
                disabled={unassigned.length === 0}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed
                           text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                + Add realtor
              </button>
              {showAddDropdown && unassigned.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-teal-200
                                rounded-xl shadow-lg z-10 overflow-hidden">
                  {unassigned.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAdd(r.id)}
                      className="w-full text-left px-4 py-2.5 text-sm text-teal-800
                                 hover:bg-teal-50 transition-colors border-b border-teal-100
                                 last:border-0"
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="block text-xs text-teal-400">{r.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {assigned.length === 0 ? (
            <p className="text-sm text-teal-400 text-center py-6">
              No realtors assigned yet.
            </p>
          ) : (
            <div className="space-y-2">
              {assigned.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-4 py-3 bg-teal-50
                             border border-teal-100 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-teal-800">{r.name}</p>
                    <p className="text-xs text-teal-400">{r.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(r.id)}
                    disabled={removingId === r.id || addingId === r.id}
                    className="w-6 h-6 flex items-center justify-center rounded-full
                               text-teal-400 hover:text-red-500 hover:bg-red-50
                               transition-colors disabled:opacity-40"
                    aria-label={`Remove ${r.name}`}
                  >
                    {removingId === r.id ? (
                      <span className="w-3 h-3 border border-teal-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-base leading-none">×</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite code */}
        <div className="bg-white border border-teal-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-teal-800 mb-4">Invite code</h2>
          {INVITE_CODE ? (
            <div>
              <p className="text-xs text-teal-400 mb-2">
                Share this code with realtors so they can sign in to the platform.
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5
                                 text-sm font-mono text-teal-800">
                  {INVITE_CODE}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(INVITE_CODE)}
                  className="text-xs text-teal-500 hover:text-teal-700 border border-teal-200
                             hover:border-teal-400 rounded-lg px-3 py-2.5 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-teal-400">
              No invite code configured. Set <code className="text-teal-600">NEXT_PUBLIC_INVITE_CODE</code> in your environment.
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
