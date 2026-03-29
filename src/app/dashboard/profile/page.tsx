"use client";

// src/app/dashboard/profile/page.tsx — My Profile

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sidebar } from "@/components/sidebar";
import { getRealtors, Realtor } from "@/lib/api";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] uppercase tracking-wider text-teal-400 font-medium">{label}</p>
      <p className="text-sm font-medium text-teal-800">{value ?? "—"}</p>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtors()
      .then((rs) => {
        const match = rs.find((r) => r.email.toLowerCase() === email.toLowerCase());
        setRealtor(match ?? rs[0] ?? null);
      })
      .finally(() => setLoading(false));
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const avatarUrl = session?.user?.image ?? null;
  const goals     = realtor?.yearly_goals;

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">My Profile</h1>
          <p className="text-sm text-teal-400 mt-1">Your coaching account details</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="space-y-6 max-w-xl">

            {/* Identity card */}
            <div className="bg-white border border-teal-200 rounded-xl p-6">
              <div className="flex items-center gap-5 mb-6">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={session?.user?.name ?? "Profile"}
                    width={64}
                    height={64}
                    className="rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">
                      {(session?.user?.name ?? realtor?.name ?? "?")
                        .split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-teal-800 text-lg">{session?.user?.name ?? realtor?.name}</p>
                  <p className="text-sm text-teal-400">{session?.user?.email ?? realtor?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 pt-5 border-t border-teal-100">
                <Field label="Full name"        value={realtor?.name} />
                <Field label="Email"            value={realtor?.email} />
                <Field label="Coaching focus"   value={realtor?.coaching_focus} />
              </div>
            </div>

            {/* Yearly goals card */}
            {goals && (
              <div className="bg-white border border-teal-200 rounded-xl p-6">
                <h2 className="text-sm font-semibold text-teal-800 mb-5">2026 Yearly Goals</h2>
                <div className="grid grid-cols-2 gap-5">
                  <Field
                    label="Conservative GCI"
                    value={goals.conservative_gci > 0 ? `$${goals.conservative_gci.toLocaleString()}` : "Not set"}
                  />
                  <Field
                    label="Stretch GCI"
                    value={goals.stretch_gci > 0 ? `$${goals.stretch_gci.toLocaleString()}` : "Not set"}
                  />
                  <Field label="Total deals"  value={goals.total_deals  > 0 ? goals.total_deals  : "Not set"} />
                  <Field label="Buyer deals"  value={goals.buyer_deals  > 0 ? goals.buyer_deals  : "Not set"} />
                  <Field label="Seller deals" value={goals.seller_deals > 0 ? goals.seller_deals : "Not set"} />
                </div>
              </div>
            )}

            {/* Read-only note */}
            <p className="text-xs text-teal-300 text-center pb-4">
              To update your profile, contact Martin.
            </p>

          </div>
        )}
      </main>
    </div>
  );
}
