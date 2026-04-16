"use client";

// src/app/dashboard/systems/page.tsx — Systems Setup

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Data ───────────────────────────────────────────────────────────────────────

interface Platform {
  key:         string;
  name:        string;
  url:         string;
  description: string;
}

const PLATFORMS: Platform[] = [
  {
    key:         "syssetup_matrix",
    name:        "Matrix (MLS)",
    url:         "https://gmreb.clareityi.net/idp/login",
    description: "MLS listings, comparables, and market data.",
  },
  {
    key:         "syssetup_txdesk",
    name:        "Transaction Desk",
    url:         "https://pr.transactiondesk.com",
    description: "Input transactions for listings and accepted offers. Guides in Shared Drive.",
  },
  {
    key:         "syssetup_paol",
    name:        "PAOL SNB",
    url:         "https://paol-efel.snb.ca/paol.html",
    description: "Property assessment lookup.",
  },
  {
    key:         "syssetup_leading_re",
    name:        "Leading RE (LPI)",
    url:         "https://leadingre.com",
    description: "Global relocation network and training platform.",
  },
  {
    key:         "syssetup_real_academy",
    name:        "REAL Academy",
    url:         "https://real.academy",
    description: "Career journey training: New Agent, Experienced, and Top Producer tracks.",
  },
  {
    key:         "syssetup_real_website",
    name:        "Real Website",
    url:         "https://app.therealbrokerage.com",
    description: "Your public agent profile and brand presence on the Real platform.",
  },
];

interface Guide {
  key:   string;
  label: string;
}

const GUIDES: Guide[] = [
  { key: "syssetup_guide_1",  label: "Intro to Transaction Desk" },
  { key: "syssetup_guide_2",  label: "Creating a Listing" },
  { key: "syssetup_guide_3a", label: "3A. Receiving an Offer" },
  { key: "syssetup_guide_3b", label: "3B. Making an Offer" },
  { key: "syssetup_guide_4",  label: "Accepted Agreement of P+S" },
];

const ALL_KEYS = [...PLATFORMS.map((p) => p.key), ...GUIDES.map((g) => g.key)];

// ── Helpers ────────────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#0D5C63]">{done} of {total} items completed</span>
        <span className="text-sm font-semibold text-[#0D5C63]">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-teal-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0D5C63] rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,   setRealtor]   = useState<Realtor | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email).then((r) => {
      if (!r) { router.push("/"); return; }
      setRealtor(r);
      setCompleted(new Set(r.roadmap_completed ?? []));
    }).finally(() => setLoading(false));
  }, [status, session, router]);

  async function toggle(key: string, val: boolean) {
    if (!realtor) return;
    setCompleted((prev) => {
      const next = new Set(prev);
      val ? next.add(key) : next.delete(key);
      return next;
    });
    try {
      const updated = await patchRoadmapItem(realtor.id, key, val);
      setCompleted(new Set(updated));
    } catch {
      setCompleted((prev) => {
        const next = new Set(prev);
        val ? next.delete(key) : next.add(key);
        return next;
      });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F0FAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const doneCount = ALL_KEYS.filter((k) => completed.has(k)).length;

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D5C63]">Systems Setup</h1>
            <p className="text-sm text-teal-500 mt-1">Get connected to every tool you'll use as a Creativ Realty agent.</p>
          </div>

          <ProgressBar done={doneCount} total={ALL_KEYS.length} />

          {/* Platform cards */}
          <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider mb-3">Platforms</h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {PLATFORMS.map((p) => {
              const done = completed.has(p.key);
              return (
                <div
                  key={p.key}
                  className={`bg-white border rounded-xl p-4 flex flex-col gap-2 transition-colors
                              ${done ? "border-[#0D5C63] bg-teal-50/40" : "border-[#B2DFDB]"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-[#0D5C63]">{p.name}</span>
                    {done && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#0D5C63] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-600 leading-relaxed">{p.description}</p>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0D5C63] font-medium hover:underline"
                  >
                    → {p.url.replace(/^https?:\/\//, "")}
                  </a>
                  <button
                    onClick={() => toggle(p.key, !done)}
                    className={`mt-auto text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors self-start
                                ${done
                                  ? "border-teal-200 text-teal-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                                  : "border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white"}`}
                  >
                    {done ? "✓ Set up" : "Mark as set up"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Transaction Desk guides */}
          <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider mb-3">
            Transaction Desk — Key Guides (in Shared Drive)
          </h2>
          <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden">
            <ul className="divide-y divide-teal-50">
              {GUIDES.map((g) => {
                const done = completed.has(g.key);
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      onClick={() => toggle(g.key, !done)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-teal-50 transition-colors"
                    >
                      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                       transition-colors
                                       ${done ? "bg-[#0D5C63] border-[#0D5C63]" : "border-teal-300"}`}>
                        {done && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className={`text-sm ${done ? "line-through text-teal-400" : "text-teal-800"}`}>
                        {g.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
