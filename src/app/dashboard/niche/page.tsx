"use client";

// src/app/dashboard/niche/page.tsx — Niche Finder

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Data ───────────────────────────────────────────────────────────────────────

interface Niche {
  key:         string;
  label:       string;
  description: string;
  checklist:   string[];
}

const NICHES: Niche[] = [
  {
    key:         "neighbourhood_specialist",
    label:       "Neighbourhood Specialist",
    description: "Know one community better than anyone — every street, listing history, school, and development.",
    checklist: [
      "Learn the 5-year sales history for your target neighbourhood",
      "Preview every active listing in that neighbourhood quarterly",
      "Attend local community association meetings",
      "Build relationships with local businesses",
      "Create a neighbourhood market report (monthly or quarterly)",
      "Set up Google Alerts for your neighbourhood name",
      "Partner with a local mortgage broker who knows the area",
    ],
  },
  {
    key:         "first_time_buyers",
    label:       "First-Time Homebuyers",
    description: "Guide first-timers through financing, grants, and the full step-by-step process.",
    checklist: [
      "Learn all current first-time buyer grants and programs (FTHBI, RRSP, provincial)",
      "Build a first-time buyer guide PDF for your market",
      "Partner with a mortgage broker who specializes in first-time buyers",
      "Partner with a home inspector you trust",
      "Create a step-by-step buyer timeline (offer → close)",
      "Practice explaining pre-approval in simple language",
      "Host or attend a first-time buyer seminar",
    ],
  },
  {
    key:         "luxury",
    label:       "Luxury Homes",
    description: "High-end properties, staging, affluent buyer/seller needs, and premium marketing.",
    checklist: [
      "Preview luxury listings regularly — know the product",
      "Build relationships with luxury stagers and photographers",
      "Study luxury marketing: lifestyle copy, magazine-quality visuals",
      "Join a luxury network (Leading RE / LPI is your asset here)",
      "Dress and present at the level of your clients",
      "Partner with estate lawyers, wealth managers, and private bankers",
      "Create a luxury listing presentation that feels premium",
    ],
  },
  {
    key:         "downsizers",
    label:       "Downsizers / Retirees",
    description: "Help empty nesters sell the family home and transition to condos or retirement communities.",
    checklist: [
      "Learn condo and retirement community options in your market",
      "Partner with a senior move manager or estate sale specialist",
      "Understand the emotional side of selling a family home",
      "Build a downsizer checklist: timeline, costs, what to expect",
      "Connect with financial planners who work with retirees",
      "Attend senior living expos or community events",
      "Build referral relationships with senior care advisors",
    ],
  },
  {
    key:         "investment",
    label:       "Investment Properties",
    description: "Multi-units, cap rates, rental market, landlord-tenant law — the investor's trusted advisor.",
    checklist: [
      "Learn cap rate, cash-on-cash return, and GRM calculations",
      "Study the rental market: vacancy rates, average rents by area",
      "Build relationships with property managers",
      "Learn landlord-tenant law basics for New Brunswick",
      "Partner with an accountant who specializes in real estate investors",
      "Join local real estate investor groups or meetups",
      "Create an investment property analysis template",
    ],
  },
  {
    key:         "relocation",
    label:       "Relocation Specialist",
    description: "Corporate moves, out-of-province buyers, military transfers — a growing lane in Greater Moncton.",
    checklist: [
      "Register and get trained on Leading RE / LPI platform",
      "Build a Moncton relocation guide (cost of living, schools, neighbourhoods)",
      "Partner with corporate HR contacts and relocation companies",
      "Learn the timelines and pain points of out-of-province moves",
      "Build relationships with moving companies",
      "Understand the military posting cycle (CFB Gagetown is nearby)",
      "Create a \"Welcome to Moncton\" package for incoming clients",
    ],
  },
  {
    key:         "new_construction",
    label:       "New Construction / Developers",
    description: "Partner with builders, pre-construction pricing, and development marketing.",
    checklist: [
      "Visit every active development site in your market",
      "Build relationships with local builders and developers",
      "Learn pre-construction pricing, deposits, and closing timelines",
      "Understand builder contracts vs standard NBREA forms",
      "Partner with a lawyer experienced in new construction closings",
      "Learn about municipal zoning and development permit processes",
      "Stay current on new subdivision announcements",
    ],
  },
  {
    key:         "cultural",
    label:       "Cultural / Language Niche",
    description: "Serve a specific community in their language and with an understanding of their values.",
    checklist: [
      "Identify the specific community you're serving and their housing needs",
      "Learn key terms and processes in their language if applicable",
      "Build a referral network within that community",
      "Partner with community organizations, cultural centres, or places of worship",
      "Understand specific financing challenges that community may face",
      "Attend cultural events and become a trusted face",
      "Create marketing materials in the community's language",
    ],
  },
];

// Keys helpers
const selKey  = (nicheKey: string) => `niche_sel:${nicheKey}`;
const chkKey  = (nicheKey: string, idx: number) => `niche_chk:${nicheKey}:${idx}`;

function parseSelected(completed: Set<string>): string | null {
  for (const k of completed) {
    if (k.startsWith("niche_sel:")) return k.slice("niche_sel:".length);
  }
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function NichePage() {
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

  async function selectNiche(nicheKey: string) {
    if (!realtor) return;
    const prevSel = parseSelected(completed);
    if (prevSel === nicheKey) return; // already selected

    // Optimistic
    setCompleted((prev) => {
      const next = new Set(prev);
      // Remove old selection
      if (prevSel) next.delete(selKey(prevSel));
      next.add(selKey(nicheKey));
      return next;
    });

    try {
      // Remove old selection, add new
      let updated: string[];
      if (prevSel) {
        updated = await patchRoadmapItem(realtor.id, selKey(prevSel), false);
      }
      updated = await patchRoadmapItem(realtor.id, selKey(nicheKey), true);
      setCompleted(new Set(updated));
    } catch {
      // Revert
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(selKey(nicheKey));
        if (prevSel) next.add(selKey(prevSel));
        return next;
      });
    }
  }

  async function toggleChecklist(nicheKey: string, idx: number, val: boolean) {
    if (!realtor) return;
    const key = chkKey(nicheKey, idx);
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

  const selectedKey    = parseSelected(completed);
  const selectedNiche  = NICHES.find((n) => n.key === selectedKey) ?? null;
  const checklistDone  = selectedNiche
    ? selectedNiche.checklist.filter((_, i) => completed.has(chkKey(selectedNiche.key, i))).length
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D5C63]">Finding My Niche</h1>
            <p className="text-sm text-teal-500 mt-1">
              The most successful realtors aren't everything to everyone — they own a lane.
            </p>
          </div>

          {/* Niche grid */}
          <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider mb-3">
            Step 1 — Choose your niche
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {NICHES.map((n) => {
              const selected = selectedKey === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => selectNiche(n.key)}
                  className={`text-left p-4 rounded-xl border transition-all
                              ${selected
                                ? "border-[#0D5C63] bg-teal-50 ring-2 ring-[#0D5C63]/20"
                                : "border-[#B2DFDB] bg-white hover:border-[#0D5C63]"}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-[#0D5C63]">{n.label}</span>
                    {selected && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#0D5C63] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-teal-600 leading-relaxed">{n.description}</p>
                </button>
              );
            })}
          </div>

          {/* Checklist panel */}
          {selectedNiche && (
            <div>
              <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider mb-3">
                Step 2 — {selectedNiche.label} Focus Checklist
              </h2>

              {/* Progress */}
              <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0D5C63]">
                    {checklistDone} of {selectedNiche.checklist.length} completed
                  </span>
                  <span className="text-sm font-semibold text-[#0D5C63]">
                    {Math.round((checklistDone / selectedNiche.checklist.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-teal-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0D5C63] rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((checklistDone / selectedNiche.checklist.length) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden mb-6">
                <ul className="divide-y divide-teal-50">
                  {selectedNiche.checklist.map((item, idx) => {
                    const done = completed.has(chkKey(selectedNiche.key, idx));
                    return (
                      <li key={idx}>
                        <button
                          type="button"
                          onClick={() => toggleChecklist(selectedNiche.key, idx, !done)}
                          className="w-full flex items-start gap-3 px-5 py-3.5 text-left
                                     hover:bg-teal-50 transition-colors"
                        >
                          <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center
                                           justify-center shrink-0 transition-colors
                                           ${done ? "bg-[#0D5C63] border-[#0D5C63]" : "border-teal-300"}`}>
                            {done && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                                <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                      strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>
                          <span className={`text-sm leading-snug ${done ? "line-through text-teal-400" : "text-teal-800"}`}>
                            {item}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Amber callout */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <p className="text-sm text-amber-700 leading-relaxed">
              <span className="font-semibold">💡 Pick a niche that connects to your life</span> — not just your market knowledge.
              If you coach hockey, you already have a community. Build from there.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
