"use client";

// src/app/coach/add/page.tsx — Add a realtor to the coach's roster

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { createAdminRealtor } from "@/lib/api";

export default function AddRealtorPage() {
  const { status } = useSession();
  const router     = useRouter();

  const [coachId,      setCoachId]      = useState<string | null>(null);
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [focus,        setFocus]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    const id = sessionStorage.getItem("coachId");
    if (!id) { router.push("/coach"); return; }
    setCoachId(id);
  }, [status, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!coachId) return;
    setError("");
    setSubmitting(true);
    try {
      await createAdminRealtor({
        name:     name.trim(),
        email:    email.trim(),
        coach_id: coachId,
      });
      setSuccess(true);
      setTimeout(() => router.push("/coach"), 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || coachId === null) {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 flex flex-col items-center">

        <div className="w-full max-w-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-teal-800">Add a Realtor®</h1>
            <p className="text-sm text-teal-400 mt-1">They'll be assigned to your roster immediately.</p>
          </div>

          <div className="bg-white border border-teal-200 rounded-xl p-6">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-600 text-lg">✓</span>
                </div>
                <p className="text-sm font-medium text-teal-800">Realtor added!</p>
                <p className="text-xs text-teal-400">Redirecting to dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-teal-500 mb-1.5">
                    Full name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Marie Tremblay"
                    className="w-full bg-white border border-teal-200 focus:border-teal-400 rounded-xl
                               px-4 py-2.5 text-sm text-teal-800 focus:outline-none transition-colors
                               placeholder:text-teal-300"
                  />
                </div>

                <div>
                  <label className="block text-xs text-teal-500 mb-1.5">
                    Email address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="e.g. marie@creativrealty.com"
                    className="w-full bg-white border border-teal-200 focus:border-teal-400 rounded-xl
                               px-4 py-2.5 text-sm text-teal-800 focus:outline-none transition-colors
                               placeholder:text-teal-300"
                  />
                </div>

                <div>
                  <label className="block text-xs text-teal-500 mb-1.5">
                    Coaching focus <span className="text-teal-300">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="e.g. Listings, Prospecting"
                    className="w-full bg-white border border-teal-200 focus:border-teal-400 rounded-xl
                               px-4 py-2.5 text-sm text-teal-800 focus:outline-none transition-colors
                               placeholder:text-teal-300"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white
                               font-medium text-sm px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {submitting ? "Adding…" : "Add Realtor"}
                  </button>
                  <a
                    href="/coach"
                    className="text-sm text-teal-400 hover:text-teal-600 transition-colors"
                  >
                    Cancel
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
