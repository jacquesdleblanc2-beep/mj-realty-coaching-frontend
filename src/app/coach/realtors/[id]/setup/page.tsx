"use client";

// src/app/coach/realtors/[id]/setup/page.tsx — First-time strategy setup

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { getRealtor, Realtor } from "@/lib/api";
import { StrategyForm } from "../_form";
import { useCoachId } from "@/lib/useCoachId";

function SetupPageInner({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const router                    = useRouter();
  const coachId                   = useCoachId();
  const SUPER_ADMIN               = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
  const isSuperAdmin              = session?.user?.email?.toLowerCase() === SUPER_ADMIN?.toLowerCase();
  const searchParams              = useSearchParams();
  const isNew                     = searchParams.get("new") === "true";

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

      <main className="flex-1 p-8 overflow-auto max-w-2xl">

        {isNew && (
          <div className="bg-teal-600 text-white rounded-xl px-5 py-3 mb-6 text-sm font-medium">
            Realtor added! Set up their coaching strategy before they log in.
          </div>
        )}

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        ) : realtor && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-medium text-teal-800">
                Set up {realtor.name}&apos;s strategy
              </h1>
              <p className="text-sm text-teal-400 mt-1">
                Configure goals, tasks, and coaching focus.
              </p>
            </div>

            <StrategyForm
              realtor={realtor}
              saveLabel="Save & Finish"
              onSaveSuccess={() => router.push("/coach?added=1")}
            />
          </>
        )}

      </main>
    </div>
  );
}

export default function SetupPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    }>
      <SetupPageInner id={params.id} />
    </Suspense>
  );
}
