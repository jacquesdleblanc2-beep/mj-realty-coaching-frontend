"use client";

// src/app/dashboard/niche/page.tsx — Niche Finder

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Data ───────────────────────────────────────────────────────────────────────

interface ChecklistSection {
  heading: string;
  items:   string[];
}

interface Niche {
  key:         string;
  label:       string;
  description: string;
  sections:    ChecklistSection[];
}

const NICHES: Niche[] = [
  {
    key:         "neighbourhood_specialist",
    label:       "Neighbourhood Specialist",
    description: "Know one community better than anyone — every street, listing history, school, and development.",
    sections: [
      {
        heading: "Know Your Territory",
        items: [
          "Learn the 5-year sales history for your target neighbourhood (sold price, days on market, list-to-sell ratio)",
          "Preview every active and recently sold listing in that neighbourhood — do this quarterly at minimum",
          "Map every street, school, park, transit route, and development project in your area",
          "Track new listings the day they hit MLS — be the first to know",
          "Study municipal zoning maps and understand what can be built where",
        ],
      },
      {
        heading: "Build Local Authority",
        items: [
          "Attend local community association or neighbourhood council meetings",
          "Introduce yourself to local business owners — coffee shops, gyms, restaurants",
          "Host or sponsor a community event (block party, cleanup, market)",
          "Create a monthly neighbourhood market report (1 page — price, inventory, days on market)",
          "Set up Google Alerts for your neighbourhood name and nearby streets",
        ],
      },
      {
        heading: "Build Your Referral Network",
        items: [
          "Partner with a local mortgage broker who knows your area's price points",
          "Build relationships with 2–3 home inspectors familiar with neighbourhood housing stock (age, common issues)",
          "Connect with a notary or real estate lawyer active in your market",
          "Identify the top 3 agents who list most in your area — understand their approach",
        ],
      },
      {
        heading: "Marketing & Presence",
        items: [
          "Farm your neighbourhood with door knocking at least once per quarter",
          "Send a \"just listed\" or \"just sold\" postcard to surrounding homes after every transaction",
          "Post neighbourhood-specific content weekly: market stats, local events, hidden gems",
          "Create a \"Living in [Neighbourhood]\" video or social series",
        ],
      },
    ],
  },
  {
    key:         "first_time_buyers",
    label:       "First-Time Homebuyers",
    description: "Guide first-timers through financing, grants, and the full step-by-step process.",
    sections: [
      {
        heading: "Master the Process",
        items: [
          "Learn every step of the buying process from pre-approval to key handover — know it cold",
          "Understand CMHC mortgage insurance: when it applies, what it costs, how it affects affordability",
          "Learn all current first-time buyer programs: FTHBI, Home Buyers' Plan (RRSP), provincial rebates",
          "Know the Land Transfer Tax (or exemptions) applicable in New Brunswick",
          "Build a step-by-step buyer timeline document you can hand to every client",
        ],
      },
      {
        heading: "Build Your Expert Team",
        items: [
          "Partner with a mortgage broker who specializes in first-time buyers and educates clients",
          "Have 2–3 home inspectors you can recommend with confidence",
          "Know a real estate lawyer who is patient with first-timers and explains everything",
          "Build a list of trusted tradespeople for post-closing repairs and improvements",
        ],
      },
      {
        heading: "Client Education & Communication",
        items: [
          "Create a \"First-Time Buyer Guide\" PDF for your market (process, costs, what to expect)",
          "Practice explaining pre-approval, conditions, and closing costs in plain language",
          "Role-play the buyer consultation: goals, budget, timeline, the process",
          "Develop a communication cadence — first-timers need more check-ins and reassurance",
          "Host or attend a first-time buyer seminar or webinar",
        ],
      },
      {
        heading: "Marketing",
        items: [
          "Run social content around first-timer questions: \"What does closing cost?\" \"When do I need an inspector?\"",
          "Ask every first-time buyer client for a review immediately after closing — their story is your best ad",
          "Build relationships with HR departments or employee groups (first-time buyers are often young professionals)",
        ],
      },
    ],
  },
  {
    key:         "luxury",
    label:       "Luxury Homes",
    description: "High-end properties, staging, affluent buyer/seller needs, and premium marketing.",
    sections: [
      {
        heading: "Know the Product",
        items: [
          "Preview every luxury listing in your market — know what $800K, $1M, and $1.5M+ looks like locally",
          "Study the luxury buyer and seller mindset: privacy, discretion, premium experience",
          "Track days on market and list-to-sell ratios for properties above your market's luxury threshold",
          "Understand the difference between luxury marketing and standard residential marketing",
        ],
      },
      {
        heading: "Build a Premium Brand",
        items: [
          "Invest in professional photography, video, and drone for every listing — no exceptions",
          "Develop a luxury listing presentation that feels like a premium product",
          "Dress, communicate, and present at the level of your clients",
          "Build a personal brand that signals expertise: refined content, high-quality visuals",
        ],
      },
      {
        heading: "Build Your Expert Network",
        items: [
          "Connect with estate lawyers, wealth managers, and private bankers",
          "Partner with luxury stagers and interior designers",
          "Build relationships with high-end tradespeople: custom builders, architects, renovation specialists",
          "Identify referral sources: financial advisors, accountants, corporate relocation contacts",
        ],
      },
      {
        heading: "Marketing & Reach",
        items: [
          "Leverage Leading RE / LPI for international buyer reach",
          "Create lifestyle-focused listing content — sell the life, not just the square footage",
          "Explore print marketing: luxury magazine placements, neighbourhood-specific mailers",
          "Attend luxury real estate events, charity galas, and high-end community events",
        ],
      },
    ],
  },
  {
    key:         "downsizers",
    label:       "Downsizers / Retirees",
    description: "Help empty nesters sell the family home and transition to condos or retirement communities.",
    sections: [
      {
        heading: "Understand the Client",
        items: [
          "Learn the emotional journey of selling a family home — this is one of the biggest transitions of their life",
          "Understand the financial picture: capital gains considerations, pension income, estate planning context",
          "Know the local condo and retirement community options inside out — pricing, fees, amenities, waitlists",
          "Study the difference between independent living, assisted living, and retirement communities",
        ],
      },
      {
        heading: "Build Your Expert Team",
        items: [
          "Partner with a senior move manager or estate sale specialist",
          "Connect with a real estate lawyer experienced in estate and downsizing transactions",
          "Build a relationship with a financial planner who works with retirees",
          "Know 2–3 moving companies that specialize in seniors or full-service moves",
          "Connect with senior care advisors and home care agencies",
        ],
      },
      {
        heading: "The Client Experience",
        items: [
          "Create a \"Downsizing Guide\" for your market: what to expect, timeline, costs, options",
          "Build a communication style that is patient, clear, and never rushed",
          "Offer to connect clients with tradespeople to prepare their home for sale (declutter, repairs, staging)",
          "Follow up after closing — this client has referral potential in their entire retirement community",
        ],
      },
      {
        heading: "Marketing & Presence",
        items: [
          "Attend senior living expos and retirement community events",
          "Present to seniors groups, libraries, and community centres on the downsizing process",
          "Create content around the downsizing journey: \"How to decide when it's time,\" \"What to look for in a condo\"",
          "Build referral relationships with accountants, lawyers, and doctors who serve senior clients",
        ],
      },
    ],
  },
  {
    key:         "investment",
    label:       "Investment Properties",
    description: "Multi-units, cap rates, rental market, landlord-tenant law — the investor's trusted advisor.",
    sections: [
      {
        heading: "Know the Numbers",
        items: [
          "Learn cap rate, cash-on-cash return, gross rent multiplier (GRM), and NOI calculations — know them cold",
          "Study the rental market: average rents by area and unit type, vacancy rates, rent trends",
          "Understand how mortgage financing works for investment properties (higher down payments, stress test)",
          "Learn the basics of landlord-tenant law in New Brunswick — rights, obligations, eviction process",
          "Build a simple investment property analysis spreadsheet you can use with every client",
        ],
      },
      {
        heading: "Build Your Expert Network",
        items: [
          "Partner with an accountant who specializes in real estate investors — incorporation, depreciation, tax strategy",
          "Build relationships with property managers in your market",
          "Connect with real estate lawyers experienced in investment transactions and title issues",
          "Know mortgage brokers who specialize in investor financing (multi-unit, commercial-residential)",
        ],
      },
      {
        heading: "Build Your Investor Client Base",
        items: [
          "Join local real estate investor groups, Facebook groups, and meetups",
          "Attend REIN (Real Estate Investment Network) events if accessible",
          "Create an \"Investment Property Buyer Guide\" covering analysis, financing, and due diligence",
          "Offer free investment property analysis sessions to build trust and pipeline",
        ],
      },
      {
        heading: "Marketing & Authority",
        items: [
          "Post content for investors: cap rate explainers, market rent reports, \"what makes a good investment property\"",
          "Track every multi-unit listing in your market — know the inventory better than anyone",
          "Build a reputation as the go-to agent for investors by being the most educated person in the room",
        ],
      },
    ],
  },
  {
    key:         "relocation",
    label:       "Relocation Specialist",
    description: "Corporate moves, out-of-province buyers, military transfers — a growing lane in Greater Moncton.",
    sections: [
      {
        heading: "Know the Market for Newcomers",
        items: [
          "Build a comprehensive Moncton relocation guide: neighbourhoods, schools, cost of living, commute times",
          "Know the French/English language dynamics across different areas of Greater Moncton",
          "Study corporate sectors in the area: federal government, healthcare, tech, military (CFB Gagetown posting cycle)",
          "Understand the out-of-province buyer journey — they often can't visit multiple times, decisions move fast",
        ],
      },
      {
        heading: "Build Your Referral Network",
        items: [
          "Register and get trained on the Leading RE / LPI relocation platform",
          "Build relationships with corporate HR departments and relocation companies",
          "Connect with military family resource centres (DND postings bring buyers every spring and summer)",
          "Partner with mortgage brokers familiar with out-of-province buyers and portability situations",
        ],
      },
      {
        heading: "The Client Experience",
        items: [
          "Develop a virtual tour and video walkthrough process — relocating buyers often decide without visiting",
          "Create a \"Welcome to Moncton\" package: neighbourhoods overview, service providers, schools, things to do",
          "Offer neighbourhood video tours you can send before a client arrives",
          "Be available across time zones — clients may be calling from BC, Ontario, or overseas",
        ],
      },
      {
        heading: "Marketing & Presence",
        items: [
          "Create content specifically for people moving to Moncton: \"What to expect,\" \"Best neighbourhoods for families\"",
          "Run targeted social ads to out-of-province audiences considering Atlantic Canada",
          "Build partnerships with moving companies that handle long-distance moves into the Maritimes",
        ],
      },
    ],
  },
  {
    key:         "new_construction",
    label:       "New Construction / Developers",
    description: "Partner with builders, pre-construction pricing, and development marketing.",
    sections: [
      {
        heading: "Know the Product",
        items: [
          "Visit every active development site and new subdivision in your market regularly",
          "Learn pre-construction pricing structures, deposit schedules, and typical closing timelines",
          "Understand builder contracts and how they differ from standard NBREA purchase and sale forms",
          "Know the upgrades game — what's standard, what's an upgrade, and what's negotiable",
          "Study local zoning, development permits, and subdivision approval processes",
        ],
      },
      {
        heading: "Build Your Builder Network",
        items: [
          "Introduce yourself to every local builder and developer — become a known face",
          "Understand each builder's process, timelines, and reputation for delivery and quality",
          "Know which builders allow buyer agents and which try to cut them out",
          "Build relationships with municipal planning and development offices",
        ],
      },
      {
        heading: "Protect Your Clients",
        items: [
          "Always recommend a lawyer experienced in new construction for contract review before signing",
          "Educate buyers on tarion-style warranty coverage available in NB and what's excluded",
          "Know the risks of buying pre-construction: delays, material substitutions, market shifts at closing",
          "Advise buyers on the HST new housing rebate and when it applies",
        ],
      },
      {
        heading: "Marketing & Authority",
        items: [
          "Post content about local developments: ground breaks, model home openings, project updates",
          "Position yourself as the agent who knows what's coming before it's listed",
          "Create a \"Buying New Construction\" guide covering the full process",
        ],
      },
    ],
  },
  {
    key:         "cultural",
    label:       "Cultural / Language Niche",
    description: "Serve a specific community in their language and with an understanding of their values.",
    sections: [
      {
        heading: "Know Your Community",
        items: [
          "Identify the specific community you're serving and understand their housing needs, concerns, and priorities",
          "Learn the key terms, processes, and documents in their language if applicable",
          "Understand financing challenges specific to that community: newcomer mortgage rules, credit history, co-signers",
          "Know which neighbourhoods have the strongest presence of that community and why",
        ],
      },
      {
        heading: "Build Authentic Presence",
        items: [
          "Attend community events, cultural festivals, and gatherings — show up consistently, not just when selling",
          "Partner with community organizations, cultural centres, mosques, temples, churches, or places of worship",
          "Become a trusted resource, not just a salesperson — answer questions freely and without agenda",
          "Build your profile in community-specific Facebook groups, WhatsApp networks, or forums",
        ],
      },
      {
        heading: "Build Your Expert Team",
        items: [
          "Partner with a mortgage broker who understands newcomer and cultural-specific financing situations",
          "Connect with a multilingual lawyer or notary if relevant to your community",
          "Know community-specific resources: settlement services, newcomer support agencies, language schools",
        ],
      },
      {
        heading: "Marketing & Presence",
        items: [
          "Create marketing materials, social content, and videos in the community's language",
          "Build a reputation as the agent who \"gets it\" — someone from or deeply connected to the community",
          "Ask for reviews in the community's language — word of mouth within tight communities is extremely powerful",
          "Consider translating your buyer and seller guides into the community's primary language",
        ],
      },
    ],
  },
];

// ── Keys helpers ───────────────────────────────────────────────────────────────

const selKey = (nicheKey: string) => `niche_sel:${nicheKey}`;
const chkKey = (nicheKey: string, sectionIdx: number, itemIdx: number) =>
  `niche_chk:${nicheKey}:${sectionIdx}:${itemIdx}`;

function parseSelected(completed: Set<string>): string | null {
  for (const k of completed) {
    if (k.startsWith("niche_sel:")) return k.slice("niche_sel:".length);
  }
  return null;
}

function nicheChecklistCount(niche: Niche): number {
  return niche.sections.reduce((sum, s) => sum + s.items.length, 0);
}

function nicheCompletedCount(niche: Niche, completed: Set<string>): number {
  return niche.sections.reduce(
    (sum, s, si) => sum + s.items.filter((_, ii) => completed.has(chkKey(niche.key, si, ii))).length,
    0
  );
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
    if (prevSel === nicheKey) return;

    setCompleted((prev) => {
      const next = new Set(prev);
      if (prevSel) next.delete(selKey(prevSel));
      next.add(selKey(nicheKey));
      return next;
    });

    try {
      if (prevSel) await patchRoadmapItem(realtor.id, selKey(prevSel), false);
      const updated = await patchRoadmapItem(realtor.id, selKey(nicheKey), true);
      setCompleted(new Set(updated));
    } catch {
      setCompleted((prev) => {
        const next = new Set(prev);
        next.delete(selKey(nicheKey));
        if (prevSel) next.add(selKey(prevSel));
        return next;
      });
    }
  }

  async function toggleChecklist(nicheKey: string, sectionIdx: number, itemIdx: number, val: boolean) {
    if (!realtor) return;
    const key = chkKey(nicheKey, sectionIdx, itemIdx);
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

  const selectedKey   = parseSelected(completed);
  const selectedNiche = NICHES.find((n) => n.key === selectedKey) ?? null;
  const totalItems    = selectedNiche ? nicheChecklistCount(selectedNiche) : 0;
  const doneItems     = selectedNiche ? nicheCompletedCount(selectedNiche, completed) : 0;

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Finding My Niche</h1>
            <p className="text-sm text-[#0A4A50] mt-1">
              The most successful realtors aren&apos;t everything to everyone — they own a lane.
            </p>
          </div>

          {/* Niche grid */}
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
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
                  <p className="text-xs text-slate-600 leading-relaxed">{n.description}</p>
                </button>
              );
            })}
          </div>

          {/* Checklist panel */}
          {selectedNiche && (
            <div>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Step 2 — {selectedNiche.label} Focus Plan
              </h2>

              {/* Progress */}
              <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#0D5C63]">
                    {doneItems} of {totalItems} completed
                  </span>
                  <span className="text-sm font-semibold text-[#0D5C63]">
                    {totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0D5C63] rounded-full transition-all duration-300"
                    style={{ width: `${totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4 mb-6">
                {selectedNiche.sections.map((section, si) => (
                  <div key={si} className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-teal-50 bg-teal-50/60">
                      <h3 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">
                        {section.heading}
                      </h3>
                    </div>
                    <ul className="divide-y divide-teal-50">
                      {section.items.map((item, ii) => {
                        const done = completed.has(chkKey(selectedNiche.key, si, ii));
                        return (
                          <li key={ii}>
                            <button
                              type="button"
                              onClick={() => toggleChecklist(selectedNiche.key, si, ii, !done)}
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
                              <span className={`text-sm leading-snug ${done ? "line-through text-teal-400" : "text-slate-700"}`}>
                                {item}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
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
