"use client";

// src/app/coach/realtors/[id]/page.tsx — Realtor detail / strategy editor

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtor, Realtor } from "@/lib/api";
import { StrategyForm } from "./_form";

export default function RealtorDetailPage({ params }: { params: { id: string } }) {
  const { status }   = useSession();
  const router       = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;

    const coachId = sessionStorage.getItem("coachId");
    if (!coachId) { router.push("/coach"); return; }

    getRealtor(params.id)
      .then(setRealtor)
      .catch((e) => setError((e as Error).message));
  }, [status, params.id, router]);

  if (status === "loading" || (!realtor && !error)) {
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
                getRealtor(params.id).then(setRealtor).catch(() => {});
              }}
            />
          </>
        )}

      </main>
    </div>
  );
}
