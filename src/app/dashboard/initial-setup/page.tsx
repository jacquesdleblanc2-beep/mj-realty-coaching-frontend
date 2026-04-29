"use client";

// src/app/dashboard/initial-setup/page.tsx — Initial Setup tabbed checklist

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  INITIAL_SETUP_TABS,
  getActiveTabItems,
  getTotalItemCount,
  getCompletedItemCount,
} from "@/lib/initial-setup-config";
import { InitialSetupItemCard } from "@/components/initial-setup/InitialSetupItemCard";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function InitialSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(INITIAL_SETUP_TABS[0].id);
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

    // Optimistic update
    setCompletedIds((prev) =>
      next ? [...prev, itemId] : prev.filter((id) => id !== itemId)
    );

    try {
      const updated = await patchRoadmapItem(realtor.id, itemId, next);
      setCompletedIds(updated);
    } catch {
      // Roll back on failure
      setCompletedIds((prev) =>
        next ? prev.filter((id) => id !== itemId) : [...prev, itemId]
      );
    }
  }

  const totalItems       = getTotalItemCount();
  const completedCount   = getCompletedItemCount(completedIds);
  const progressPercent  = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const activeTabConfig  = INITIAL_SETUP_TABS.find((t) => t.id === activeTab);
  const activeItems      = getActiveTabItems(activeTab);

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
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#0D5C63] mb-2">Initial Setup</h1>
            <p className="text-gray-600 mb-6">
              Everything you need to do in your first weeks as a new REALTOR®. Each tab
              covers a category — work through them at your own pace.
            </p>

            <div className="rounded-lg bg-[#F0FAFA] border border-[#B2DFDB] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#0D5C63]">Overall progress</span>
                <span className="text-sm font-bold text-[#0D5C63]">
                  {completedCount} of {totalItems} complete ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-3 border border-[#B2DFDB]">
                <div
                  className="bg-[#0D5C63] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </header>

          <div className="mb-6 border-b border-[#B2DFDB] overflow-x-auto">
            <nav className="flex gap-1 min-w-max" role="tablist">
              {INITIAL_SETUP_TABS.map((tab) => {
                const isActive     = activeTab === tab.id;
                const isComingSoon = tab.status === "coming_soon";
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      isActive
                        ? "border-[#0D5C63] text-[#0D5C63]"
                        : "border-transparent text-gray-500 hover:text-[#0D5C63]"
                    }`}
                  >
                    <span className="mr-1">{tab.emoji}</span>
                    {tab.label}
                    {isComingSoon && (
                      <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTabConfig && (
            <div role="tabpanel">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#0D5C63] mb-1">
                  {activeTabConfig.emoji} {activeTabConfig.label}
                </h2>
                <p className="text-gray-600">{activeTabConfig.description}</p>
              </div>

              {activeTabConfig.status === "coming_soon" ? (
                <div className="rounded-lg border-2 border-dashed border-[#B2DFDB] bg-[#F0FAFA]/30 p-12 text-center">
                  <p className="text-4xl mb-3">🚧</p>
                  <p className="text-lg font-semibold text-[#0D5C63] mb-1">Coming Soon</p>
                  <p className="text-sm text-gray-600">This tab is being prepared. Check back shortly.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeItems.map((item) => (
                    <InitialSetupItemCard
                      key={item.id}
                      item={item}
                      isChecked={completedIds.includes(item.id)}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
