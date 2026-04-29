"use client";

// src/app/dashboard/emails-from-board/page.tsx — Emails from Board (NBR Onboarding)

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  INITIAL_SETUP_ITEMS,
  getCompletedItemCount,
} from "@/lib/initial-setup-config";
import { InitialSetupItemCard } from "@/components/initial-setup/InitialSetupItemCard";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function EmailsFromBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated") return;
    const email = session?.user?.email;
    if (!email) return;

    getRealtorByEmail(email)
      .then((r) => {
        if (!r) { router.push("/"); return; }
        setRealtor(r);
        setCompletedIds(Array.isArray(r.roadmap_completed) ? r.roadmap_completed : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, session, router]);

  async function handleToggle(itemId: string) {
    if (!realtor) return;
    const isCurrentlyChecked = completedIds.includes(itemId);
    const next = !isCurrentlyChecked;

    setCompletedIds((prev) =>
      next ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );

    try {
      const updated = await patchRoadmapItem(realtor.id, itemId, next);
      setCompletedIds(updated);
    } catch {
      setCompletedIds((prev) =>
        next ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    }
  }

  const boardEmails = INITIAL_SETUP_ITEMS
    .filter((item) => item.tabId === "board-emails")
    .sort((a, b) => a.order - b.order);

  const total     = boardEmails.length;
  const completed = getCompletedItemCount(completedIds);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F0FAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-[#0D5C63] mb-2">
              📧 Emails from Board (New Salesperson)
            </h1>
            <p className="text-gray-600">
              In your first 4 days you&apos;ll receive 6 emails from the Board. Each one
              has a job. Check them off as you handle them.
            </p>
          </header>

          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white border border-[#B2DFDB] px-4 py-1.5">
            <span className="text-sm font-semibold text-[#0D5C63]">
              {completed} of {total} complete
            </span>
          </div>

          <div className="space-y-4">
            {boardEmails.map((item) => (
              <InitialSetupItemCard
                key={item.id}
                item={item}
                isChecked={completedIds.includes(item.id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
