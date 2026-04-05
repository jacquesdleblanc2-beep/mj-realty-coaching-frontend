"use client";

// src/app/coach/realtors/[id]/page.tsx — Realtor detail / strategy editor

import { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtor, Realtor } from "@/lib/api";
import { StrategyForm } from "./_form";
import { useCoachId } from "@/lib/useCoachId";

export default function RealtorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }                    = use(params);
  const { data: session, status } = useSession();
  const router                    = useRouter();
  const coachId                   = useCoachId();
  const SUPER_ADMIN               = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const isSuperAdmin              = session?.user?.email?.toLowerCase() === SUPER_ADMIN?.toLowerCase();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;
    // Super-admin can access any realtor page without a coachId
    if (isSuperAdmin) return;
    // Regular coaches need coachId
    if (coachId === null) return; // still loading
    // coachId resolved but empty means not a coach
  }, [status, isSuperAdmin, coachId, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    getRealtor(id)
      .then(setRealtor)
      .catch((e) => setError((e as Error).message));
  }, [status, id]);

  // Show spinner only while session or coachId is loading
  // Super-admin never needs coachId so don't wait for it
  const isLoading = status === "loading" ||
    (!isSuperAdmin && coachId === null && status === "authenticated");

  if (isLoading || (!realtor && !error)) {
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

        <div className="mb-6">
          <a href="/coach" className="text-xs text-teal-400 hover:text-teal-600 transition-colors">
            ← Back to team
          </a>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        ) : realtor && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-teal-800">{realtor.name}</h1>
              <p className="text-sm text-teal-400 mt-1">{realtor.email}</p>
            </div>

            <StrategyForm
              realtor={realtor}
              saveLabel="Save Changes"
              onSaveSuccess={() => {
                // Re-fetch to keep local state fresh after save
                getRealtor(id).then(setRealtor).catch(() => {});
              }}
            />
          </>
        )}

      </main>
    </div>
  );
}
