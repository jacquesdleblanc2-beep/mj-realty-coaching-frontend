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
  href:        string;
  description: string;
}

const PLATFORMS: Platform[] = [
  {
    key:         "syssetup_matrix",
    name:        "Matrix (MLS)",
    url:         "gmreb.clareityi.net/idp/login",
    href:        "https://gmreb.clareityi.net/idp/login",
    description: "Your primary tool for MLS listings, market data, and comparables. You'll receive your Matrix login credentials by email from the New Brunswick Real Estate Board after your membership is approved. Your login also works for Touchbase.",
  },
  {
    key:         "syssetup_txdesk",
    name:        "Transaction Desk",
    url:         "pr.transactiondesk.com",
    href:        "https://pr.transactiondesk.com",
    description: "Input all your listings and accepted offers here. Required for every transaction. Step-by-step guides are available in the Creativ Realty Shared Drive.",
  },
  {
    key:         "syssetup_paol",
    name:        "PAOL SNB",
    url:         "paol-efel.snb.ca/paol.html",
    href:        "https://paol-efel.snb.ca/paol.html",
    description: "Property Assessment Online — search any civic address in New Brunswick to view the assessed value, property size, and tax information. Essential for pricing conversations and listing prep.",
  },
  {
    key:         "syssetup_real_academy",
    name:        "REAL Academy",
    url:         "real.academy",
    href:        "https://real.academy",
    description: "The Real Brokerage's training platform. Complete your New Agent Starter Series here and access career journey courses for every stage of your career. Log in with your Real Brokerage credentials.",
  },
  {
    key:         "syssetup_snb_planet",
    name:        "SNB PLANET",
    url:         "planet.snb.ca",
    href:        "https://planet.snb.ca",
    description: "New Brunswick's land registry portal. Search title ownership, registered documents, and property assessment records. Realtors use this to verify ownership and pull title information before listing or writing offers. Subscription is $65/month with unlimited searches — apply for an account directly on the SNB website.",
  },
  {
    key:         "syssetup_supra_ekey",
    name:        "Supra EKey",
    url:         "supraekey.com",
    href:        "https://www.supraekey.com",
    description: "The app that opens electronic lockboxes during showings. After your NBREA membership is approved, you'll receive a welcome email from the New Brunswick Real Estate Board with your authorization code and default PIN. Download the Supra EKey app, select 'I already have an authorization code,' and enter the code from that email to activate.",
  },
  {
    key:         "syssetup_touchbase",
    name:        "Touchbase",
    url:         "touchbasepro.com",
    href:        "https://www.touchbasepro.com",
    description: "Showing appointment software used by most realtors in the area to schedule and confirm showings. When you receive a showing request through Matrix, Touchbase manages the confirmation with the listing agent. Log in using the same credentials as your Matrix account.",
  },
];

const TOTAL = PLATFORMS.length; // 7

// ── Helpers ────────────────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#0D5C63]">{done} of {total} items completed</span>
        <span className="text-sm font-semibold text-[#0D5C63]">{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
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

  const doneCount = PLATFORMS.filter((p) => completed.has(p.key)).length;

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Systems Setup</h1>
            <p className="text-sm text-[#0A4A50] mt-1">Get connected to every tool you'll use as a Creativ Realty agent.</p>
          </div>

          <ProgressBar done={doneCount} total={TOTAL} />

          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platforms</h2>
          <div className="grid grid-cols-2 gap-3">
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
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                  <a
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0D5C63] font-medium hover:underline"
                  >
                    → {p.url}
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

        </div>
      </main>
    </div>
  );
}
