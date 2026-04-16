"use client";

// src/app/dashboard/roadmap/page.tsx — My Roadmap

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Roadmap data ───────────────────────────────────────────────────────────────

interface RoadmapItem {
  text:      string;
  academy?:  boolean;
}

interface RoadmapGroup {
  name:   string;
  phase?: { label: string; color: "green" | "blue" | "orange" };
  items:  RoadmapItem[];
}

interface RoadmapLevel {
  id:       string;
  label:    string;
  subtitle: string;
  badges:   string[];
  groups:   RoadmapGroup[];
}

function item(text: string, academy = false): RoadmapItem {
  return { text, ...(academy ? { academy: true } : {}) };
}

const ROADMAP_DATA: RoadmapLevel[] = [
  {
    id:       "first90",
    label:    "First 90 Days",
    subtitle: "Days 1–90 · Your fast-start action plan at Creativ Realty",
    badges:   ["Day 1 Done", "Halfway There", "Phase 2 Started", "Phase 3 Started", "90 Days Complete"],
    groups: [
      {
        name:  "Phase 1 — Foundation (Days 1–30)",
        phase: { label: "Foundation · Days 1–30", color: "green" },
        items: [
          item("Complete your NBREA membership application"),
          item("Submit your FCNB licence application under Creativ Realty"),
          item("Log in to Matrix (MLS) and explore your first listing search"),
          item("Set up Transaction Desk and read the Intro to Transaction Desk guide"),
          item("Add your sphere of influence to your CRM (minimum 50 contacts)"),
        ],
      },
      {
        name:  "Phase 2 — Outreach (Days 31–60)",
        phase: { label: "Outreach · Days 31–60", color: "blue" },
        items: [
          item("Contact every person in your sphere by phone or in-person"),
          item("Preview 10 active listings in your target area"),
          item("Complete 3 comparative market analyses (CMAs)"),
          item("Attend an open house as an observer and take notes"),
          item("Book your first buyer or seller consultation"),
        ],
      },
      {
        name:  "Phase 3 — Growth (Days 61–90)",
        phase: { label: "Growth · Days 61–90", color: "orange" },
        items: [
          item("Write your first offer or take your first listing"),
          item("Post your agent introduction on all social channels"),
          item("Set up your Google Business Profile"),
          item("Choose your niche and complete the niche checklist"),
          item("Write your 90-day business plan and share it with your coach"),
        ],
      },
    ],
  },
  {
    id:       "new",
    label:    "New Realtor",
    subtitle: "Year 0–1 · Build your foundation and close your first deals",
    badges:   ["Getting Started", "Building Momentum", "Halfway There", "Almost Done", "Level Complete"],
    groups: [
      {
        name: "Brand & online presence",
        items: [
          item("Get professional headshots"),
          item("Write a compelling personal bio"),
          item("Set up a Google Business Profile"),
          item("Create an Instagram account (real estate focused)"),
          item("Create a Facebook business page"),
          item("Create or update your LinkedIn profile"),
          item("Set up a personal real estate website or landing page"),
          item("Post your introduction announcement on all social channels"),
          item("Film and post your first property tour video"),
          item("Post 3 pieces of valuable local market content on social media"),
        ],
      },
      {
        name: "Business setup",
        items: [
          item("Order professional business cards"),
          item("Set up a dedicated real estate email address"),
          item("Record a professional voicemail greeting"),
          item("Download and set up the Supra eKey app"),
          item("Download and set up the Touchbase app"),
          item("Download the Realtor®.ca app (black logo)"),
          item("Set up a CRM and load your sphere of influence (min. 50 contacts)"),
          item("Write your 90-day business plan"),
          item("Time-block your weekly schedule (prospecting, follow-up, admin)"),
          item("Open a dedicated business bank account"),
          item("Set up basic expense tracking (income vs. costs)"),
          item("Send your \"I am now a Realtor\" announcement to your sphere"),
        ],
      },
      {
        name: "Market knowledge",
        items: [
          item("Preview 15+ active listings across your market"),
          item("Complete 5 comparative market analyses (CMAs)"),
          item("Study local MLS stats: avg days on market, avg price, absorption rate"),
          item("Attend 3+ open houses as an observer and take notes"),
          item("Choose your geographic farm area or niche"),
          item("Learn your transaction process from offer to close"),
          item("Build a vendor contact list (lenders, inspectors, notaries, lawyers)"),
          item("Shadow an experienced agent on a listing appointment"),
          item("Shadow an experienced agent on a buyer showing"),
        ],
      },
      {
        name: "Prospecting & lead generation",
        items: [
          item("Make contact with every person in your sphere (call or in-person)"),
          item("Ask 10 people directly for referrals or leads"),
          item("Host or assist at your first open house"),
          item("Knock doors in your farm area at least once"),
          item("Set up a Google alert for your farm neighborhood"),
          item("Book your first buyer consultation"),
          item("Book your first listing appointment (even if it does not convert)"),
          item("Generate your first 10 leads (any source)"),
        ],
      },
      {
        name: "Skills & presentations",
        items: [
          item("Practice your buyer consultation script 5 times (role play)"),
          item("Practice your listing presentation 5 times (role play)"),
          item("Complete your brokerage onboarding training fully"),
          item("Attend 2 REALTOR® board or networking events"),
          item("Complete 1 negotiation or objection handling course"),
          item("Read 1 real estate sales or mindset book"),
        ],
      },
      {
        name: "First deals",
        items: [
          item("Complete your first buyer representation agreement"),
          item("Write your first offer"),
          item("Take your first listing"),
          item("Close your first transaction"),
          item("Ask your first closed client for a written review"),
          item("Get your first inbound referral from someone in your sphere"),
        ],
      },
      {
        name: "Real Academy — new agent track",
        items: [
          item("Log in to Real Academy and complete your profile", true),
          item("Complete the New Agent Starter Series (12-week program)", true),
          item("Complete 5 courses in the New Agents category", true),
          item("Attend 1 live Real Academy session or virtual event", true),
          item("Complete 4 courses of your choice in the Career Journey section", true),
        ],
      },
    ],
  },
  {
    id:       "y12",
    label:    "1–2 Years",
    subtitle: "Year 1–2 · Build systems, grow your database, win more listings",
    badges:   ["Getting Started", "Building Momentum", "Halfway There", "Almost Done", "Level Complete"],
    groups: [
      {
        name: "Production & pipeline",
        items: [
          item("Close 5+ transactions in a 12-month period"),
          item("Take 3+ listings (seller side) in a year"),
          item("Have a full pipeline 60 days out at all times"),
          item("Track your lead-to-close conversion rate"),
          item("Calculate your cost per lead by source"),
          item("Review your production numbers monthly and adjust strategy"),
        ],
      },
      {
        name: "Database & CRM mastery",
        items: [
          item("Grow your CRM database to 200+ contacts"),
          item("Run a consistent monthly touch campaign to your full database"),
          item("Set up automated follow-up sequences for new leads"),
          item("Segment your database (A, B, C clients and hot, warm, cold leads)"),
          item("Track every active lead with a pipeline stage"),
          item("Ask every closed client for a referral at closing"),
        ],
      },
      {
        name: "Marketing & brand",
        items: [
          item("Post consistently 3x per week on social media for 90 days straight"),
          item("Collect 10+ Google or Zillow reviews"),
          item("Launch a monthly real estate e-newsletter to your database"),
          item("Run your first paid social media ad (listings or lead gen)"),
          item("Film and post 5+ property tour or market update videos"),
          item("Get featured in a local blog, newspaper, or community page"),
        ],
      },
      {
        name: "Listings & buyers advanced",
        items: [
          item("Create a polished buyer presentation package"),
          item("Create a polished listing presentation package"),
          item("Win a listing against a competing agent"),
          item("Complete a transaction with a complex negotiation (multiple offers, conditions)"),
          item("Hold a first-time buyer education seminar or webinar"),
          item("Master your listing price reduction conversation"),
        ],
      },
      {
        name: "Financial & business",
        items: [
          item("Set your GCI target for year 2 higher than year 1"),
          item("Set up quarterly tax payments as self-employed"),
          item("Build a 3-month personal expense reserve fund"),
          item("Understand your commission structure and renegotiate if eligible"),
          item("Track return on investment for every marketing dollar spent"),
          item("Meet with a financial advisor about retirement and wealth planning"),
        ],
      },
      {
        name: "Network & referrals",
        items: [
          item("Join a mastermind, accountability group, or agent network"),
          item("Build vendor relationships with 2 lenders, 2 inspectors, 1 lawyer"),
          item("Receive 5+ inbound referrals in a year from your network"),
          item("Attend a regional real estate conference or summit"),
          item("Connect with and learn from a top producer in your market"),
          item("Meet with your coach or mentor at least monthly"),
        ],
      },
      {
        name: "Real Academy — experienced agent track",
        items: [
          item("Complete 5 courses in the Career Journey Experienced Agent section", true),
          item("Attend 5 Community Masterminds on Real Academy", true),
          item("Complete 1 marketing or lead generation course", true),
          item("Attend a Beyond RISE or major Real Academy virtual event", true),
        ],
      },
    ],
  },
  {
    id:       "y35",
    label:    "3–5 Years",
    subtitle: "Year 3–5 · Become a market authority and build leverage",
    badges:   ["Getting Started", "Building Momentum", "Halfway There", "Almost Done", "Level Complete"],
    groups: [
      {
        name: "Production & revenue",
        items: [
          item("Close 20+ transactions in a single year"),
          item("Take 3+ listings (seller side) in a year"),
          item("Generate 50%+ of your business from referrals and repeat clients"),
          item("Achieve your target GCI consistently for 2 years in a row"),
          item("Earn a top producer award at your brokerage or board"),
          item("Rank in the top 10% of your local market by volume"),
        ],
      },
      {
        name: "Market authority",
        items: [
          item("Publish a monthly market report (written or video) for your farm"),
          item("Be quoted or featured in a local media article"),
          item("Speak on a panel or at a local industry event"),
          item("Be recognized as the go-to agent for your neighborhood or niche"),
          item("Build a neighborhood-specific social media presence or page"),
          item("Host a community event or client appreciation event"),
        ],
      },
      {
        name: "Advanced marketing",
        items: [
          item("Build an email list of 500+ past clients and warm leads"),
          item("Run a consistent YouTube, Instagram Reels, or video content strategy"),
          item("Launch a retargeting ad campaign to past website visitors"),
          item("Track and report ROI on all marketing channels monthly"),
          item("Partner with a local business for co-marketing or sponsorship"),
          item("Test one new lead generation channel and measure results for 90 days"),
        ],
      },
      {
        name: "Systems & leverage",
        items: [
          item("Hire a transaction coordinator (full-time or part-time)"),
          item("Hire a virtual assistant or part-time admin"),
          item("Create written SOPs for your listing, buying, and closing process"),
          item("Automate your follow-up and nurture sequences end to end"),
          item("Build a client review request system that runs automatically"),
          item("Measure your 5 most important business metrics every week"),
        ],
      },
      {
        name: "Designations & specialization",
        items: [
          item("Complete an advanced designation (ABR, SRS, CNE, SRES, etc.)"),
          item("Become certified in a niche (luxury, investment, first-time buyers)"),
          item("Master one lead generation channel deeply"),
          item("Write or record a definitive guide to buying or selling in your market"),
          item("Build a referral partnership with an out-of-market agent"),
        ],
      },
      {
        name: "Team & mentorship",
        items: [
          item("Formally mentor a newer agent at your brokerage"),
          item("Explore the team vs. solo agent model with a business plan"),
          item("Bring on a buyer's agent partner or admin if volume supports it"),
          item("Attend a national real estate conference"),
          item("Create a personal succession plan for your business"),
        ],
      },
      {
        name: "Real Academy — leadership track",
        items: [
          item("Complete 5 courses in Career Journey Advanced or Team Leader section", true),
          item("Attend 5 additional Community Masterminds", true),
          item("Complete a course on team building or agent attraction", true),
          item("Attend a Real Brokerage all-agent event such as RISE", true),
          item("Contribute or present content in a Real community session", true),
        ],
      },
    ],
  },
  {
    id:       "y5plus",
    label:    "5+ Years",
    subtitle: "Year 5+ · Scale, invest, lead and build your legacy",
    badges:   ["Getting Started", "Building Momentum", "Halfway There", "Almost Done", "Level Complete"],
    groups: [
      {
        name: "Scale & team",
        items: [
          item("Build a team of 2+ licensed agents with a written team agreement"),
          item("Create an agent onboarding and training program for your team"),
          item("Define your team model (rainmaker, partner-based, etc.)"),
          item("Hit a team GCI milestone ($500K, $1M, or your personal target)"),
          item("Hire a dedicated marketing coordinator or agency"),
          item("Develop your team culture, values, and vision document"),
        ],
      },
      {
        name: "Coaching & accountability",
        items: [
          item("Hire a professional real estate coach (Tom Ferry, Ninja Selling, etc.)"),
          item("Join a peer accountability group or mastermind at the national level"),
          item("Set a formal coaching goal and track it monthly for a full year"),
          item("Invest in at least one business retreat or intensive per year"),
          item("Read or listen to 12+ business or leadership books per year"),
        ],
      },
      {
        name: "Real estate investing",
        items: [
          item("Purchase your first investment property"),
          item("Analyze deals using cap rate and cash-on-cash return"),
          item("Build a relationship with an investor-focused lender"),
          item("Join a local real estate investors group or association"),
          item("Explore commercial real estate or multi-family opportunities"),
          item("Build a personal real estate investment portfolio plan"),
        ],
      },
      {
        name: "Wealth & financial independence",
        items: [
          item("Max out RRSP or IRA or retirement contributions annually"),
          item("Build 12+ months of personal expense reserves"),
          item("Create or update your will and estate plan with an advisor"),
          item("Develop a passive income strategy (rentals, coaching, referrals)"),
          item("Work with a financial planner to create a net worth roadmap"),
          item("Define your retirement target and reverse-engineer the plan"),
        ],
      },
      {
        name: "Authority & influence",
        items: [
          item("Publish a book, course, or coaching program for other agents"),
          item("Speak at a national conference or industry event"),
          item("Be recognized in a top agent publication, award, or ranking"),
          item("Build a social media audience of 5000+ engaged followers"),
          item("Launch a podcast, YouTube channel, or newsletter with regular cadence"),
          item("Create content or intellectual property that outlasts your production"),
        ],
      },
      {
        name: "Giving back & legacy",
        items: [
          item("Formally mentor 3+ agents through their first year"),
          item("Donate a percentage of commissions to a cause you believe in"),
          item("Volunteer with or sponsor a housing-related nonprofit"),
          item("Advocate for real estate or housing policy at the local or national level"),
          item("Participate in or organize a charitable real estate event"),
          item("Define your personal legacy statement for your career"),
        ],
      },
      {
        name: "Real Academy — elite track",
        items: [
          item("Complete 5 advanced leadership or scaling courses", true),
          item("Present or co-host a session in the Real Academy community", true),
          item("Attend 5 masterminds focused on team or brokerage growth", true),
          item("Complete a Real agent attraction or revenue share course", true),
        ],
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function levelItemCount(level: RoadmapLevel): number {
  return level.groups.reduce((sum, g) => sum + g.items.length, 0);
}

function levelCompletedCount(level: RoadmapLevel, completed: Set<string>): number {
  return level.groups.reduce(
    (sum, g) => sum + g.items.filter((i) => completed.has(i.text)).length,
    0
  );
}

const LEVEL_LABELS: Record<string, string> = {
  first90: "First 90 Days",
  new:     "New Realtor",
  y12:     "1–2 Years",
  y35:     "3–5 Years",
  y5plus:  "5+ Years",
};

const PHASE_STYLES: Record<"green" | "blue" | "orange", string> = {
  green:  "bg-emerald-100 text-emerald-700 border border-emerald-200",
  blue:   "bg-blue-100 text-blue-700 border border-blue-200",
  orange: "bg-orange-100 text-orange-700 border border-orange-200",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,    setRealtor]    = useState<Realtor | null>(null);
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [activeTab,  setActiveTab]  = useState<string>("new");
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    const email = session?.user?.email;
    if (!email) return;

    getRealtorByEmail(email).then((r) => {
      if (!r) { router.push("/"); return; }
      setRealtor(r);
      setCompleted(new Set(r.roadmap_completed ?? []));
      setActiveTab(r.experience_level ?? "new");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [status, session, router]);

  async function toggle(itemText: string, isChecked: boolean) {
    if (!realtor) return;
    // Optimistic update
    setCompleted((prev) => {
      const next = new Set(prev);
      if (isChecked) next.add(itemText);
      else next.delete(itemText);
      return next;
    });
    try {
      const updated = await patchRoadmapItem(realtor.id, itemText, isChecked);
      setCompleted(new Set(updated));
    } catch {
      // Revert on failure
      setCompleted((prev) => {
        const next = new Set(prev);
        if (isChecked) next.delete(itemText);
        else next.add(itemText);
        return next;
      });
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const userLevel   = realtor?.experience_level ?? "new";
  const activeLevel = ROADMAP_DATA.find((l) => l.id === activeTab) ?? ROADMAP_DATA[0];
  const total       = levelItemCount(activeLevel);
  const done        = levelCompletedCount(activeLevel, completed);
  const pct         = total > 0 ? Math.round((done / total) * 100) : 0;

  // Badge unlocks at 20/40/60/80/100%
  const badgeThresholds = [20, 40, 60, 80, 100];

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-y-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-teal-800">My Roadmap</h1>
          <p className="text-sm text-teal-500 mt-1">
            {LEVEL_LABELS[userLevel] ?? "New Realtor"} · {activeLevel.subtitle}
          </p>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {ROADMAP_DATA.map((lvl) => {
            const isUser   = lvl.id === userLevel;
            const isActive = lvl.id === activeTab;
            const lvlDone  = levelCompletedCount(lvl, completed);
            const lvlTotal = levelItemCount(lvl);
            return (
              <button
                key={lvl.id}
                onClick={() => setActiveTab(lvl.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border
                  ${isActive
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-teal-200 text-teal-600 hover:border-teal-400"}`}
              >
                {isUser && <span title="Your level">★</span>}
                {lvl.label}
                <span className={`text-xs ${isActive ? "text-teal-200" : "text-teal-400"}`}>
                  {lvlDone}/{lvlTotal}
                </span>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="bg-white border border-teal-200 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-800">{done} of {total} milestones</span>
            <span className="text-sm font-semibold text-teal-600">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-teal-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white border border-teal-200 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-4">Level Badges</h2>
          <div className="flex gap-3 flex-wrap">
            {activeLevel.badges.map((badge, idx) => {
              const threshold = badgeThresholds[idx];
              const earned    = pct >= threshold;
              return (
                <div
                  key={badge}
                  title={earned ? "Earned!" : `Unlock at ${threshold}%`}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-colors
                    ${earned
                      ? "bg-teal-50 border-teal-300 text-teal-700"
                      : "bg-gray-50 border-gray-200 text-gray-400"}`}
                >
                  <span className={`text-xl ${earned ? "" : "grayscale opacity-40"}`}>
                    {earned ? "★" : "☆"}
                  </span>
                  <span className="text-xs font-medium text-center leading-tight max-w-[80px]">
                    {badge}
                  </span>
                  {!earned && (
                    <span className="text-[10px] text-gray-400">{threshold}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-4">
          {activeLevel.groups.map((group) => {
            const groupDone  = group.items.filter((i) => completed.has(i.text)).length;
            const groupTotal = group.items.length;
            return (
              <div key={group.name} className="bg-white border border-teal-200 rounded-xl overflow-hidden">
                {/* Group header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-teal-100">
                  <div className="flex items-center gap-2 min-w-0">
                    {group.phase && (
                      <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${PHASE_STYLES[group.phase.color]}`}>
                        {group.phase.label}
                      </span>
                    )}
                    {!group.phase && (
                      <h3 className="text-sm font-semibold text-teal-800">{group.name}</h3>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0
                    ${groupDone === groupTotal
                      ? "bg-teal-100 text-teal-700"
                      : "bg-teal-50 text-teal-500"}`}>
                    {groupDone}/{groupTotal}
                  </span>
                </div>

                {/* Items */}
                <ul className="divide-y divide-teal-50">
                  {group.items.map((it) => {
                    const isChecked = completed.has(it.text);
                    return (
                      <li key={it.text}>
                        <button
                          type="button"
                          onClick={() => toggle(it.text, !isChecked)}
                          className="w-full flex items-start gap-3 px-5 py-3 text-left hover:bg-teal-50 transition-colors"
                        >
                          {/* Circle checkbox */}
                          <span className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                            ${isChecked
                              ? "bg-teal-500 border-teal-500"
                              : "border-teal-300"}`}>
                            {isChecked && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                                <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </span>

                          <span className={`text-sm leading-snug flex-1 ${isChecked ? "line-through text-teal-400" : "text-teal-800"}`}>
                            {it.text}
                          </span>

                          {it.academy && (
                            <span className="shrink-0 text-[10px] font-semibold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full mt-0.5">
                              Real Academy
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
