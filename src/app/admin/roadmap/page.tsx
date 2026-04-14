"use client";

// src/app/admin/roadmap/page.tsx — Roadmap Analytics

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

const API = process.env.NEXT_PUBLIC_API_URL;

interface ItemStat {
  text:     string;
  group:    string;
  level:    string;
  count:    number;
  realtors: string[];
}

export default function AdminRoadmapPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats,    setStats]    = useState<ItemStat[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "hot" | "cold">("all");
  const [levelTab, setLevelTab] = useState<string>("all");

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    const email = session?.user?.email;
    if (email !== process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL) { router.push("/"); return; }

    fetch(`${API}/api/realtors`)
      .then((r) => r.json())
      .then((realtors: { name: string; roadmap_completed: Record<string, string[]> | string[] }[]) => {
        // Build a map: itemText -> { count, realtors }
        const map: Record<string, { count: number; realtors: string[] }> = {};

        for (const realtor of realtors) {
          // roadmap_completed may be a flat array or a keyed object
          let items: string[] = [];
          if (Array.isArray(realtor.roadmap_completed)) {
            items = realtor.roadmap_completed;
          } else if (realtor.roadmap_completed && typeof realtor.roadmap_completed === "object") {
            items = Object.values(realtor.roadmap_completed).flat();
          }
          for (const text of items) {
            if (!map[text]) map[text] = { count: 0, realtors: [] };
            map[text].count++;
            map[text].realtors.push(realtor.name);
          }
        }

        // Map item text back to group/level using hardcoded structure
        const result: ItemStat[] = ITEM_INDEX.map(({ text, group, level }) => ({
          text,
          group,
          level,
          count:    map[text]?.count    ?? 0,
          realtors: map[text]?.realtors ?? [],
        }));

        setStats(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, session, router]);

  const levels = ["all", "New Realtor", "1–2 Years", "3–5 Years", "5+ Years"];

  const filtered = stats
    .filter((s) => levelTab === "all" || s.level === levelTab)
    .filter((s) => {
      if (filter === "hot")  return s.count >= 1;
      if (filter === "cold") return s.count === 0;
      return true;
    })
    .sort((a, b) => b.count - a.count);

  const totalRealtors = (() => {
    const names = new Set<string>();
    stats.forEach((s) => s.realtors.forEach((n) => names.add(n)));
    return names.size;
  })();

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-y-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-teal-800">Roadmap Analytics</h1>
          <p className="text-sm text-teal-500 mt-1">
            See which milestones realtors check most — and which get ignored.
            {totalRealtors > 0 && ` Based on ${totalRealtors} realtor${totalRealtors > 1 ? "s" : ""}.`}
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap mb-6">
          {/* Level tabs */}
          <div className="flex gap-2 flex-wrap">
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => setLevelTab(l)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors
                  ${levelTab === l
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-teal-200 text-teal-600 hover:border-teal-400"}`}
              >
                {l === "all" ? "All Levels" : l}
              </button>
            ))}
          </div>

          {/* Hot/cold filter */}
          <div className="flex gap-2 ml-auto">
            {(["all", "hot", "cold"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors
                  ${filter === f
                    ? "bg-orange-500 border-orange-500 text-white"
                    : "bg-white border-teal-200 text-teal-600 hover:border-teal-400"}`}
              >
                {f === "all" ? "All" : f === "hot" ? "✅ Checked" : "⚠️ Never Checked"}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-teal-200 rounded-xl p-4">
            <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-2xl font-bold text-teal-800">{filtered.length}</p>
          </div>
          <div className="bg-white border border-teal-200 rounded-xl p-4">
            <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">Most Checked</p>
            <p className="text-sm font-semibold text-teal-800 truncate">
              {filtered[0]?.count > 0 ? filtered[0].text : "—"}
            </p>
            <p className="text-xs text-teal-400">{filtered[0]?.count ?? 0} realtors</p>
          </div>
          <div className="bg-white border border-teal-200 rounded-xl p-4">
            <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">Never Checked</p>
            <p className="text-2xl font-bold text-orange-500">
              {filtered.filter((s) => s.count === 0).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-teal-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-teal-50 border-b border-teal-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">Milestone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">Group</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">Level</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">Checked by</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-teal-600 uppercase tracking-wider">Realtors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              {filtered.map((s) => (
                <tr key={s.text} className="hover:bg-teal-50 transition-colors">
                  <td className="px-5 py-3 text-teal-800 max-w-xs">{s.text}</td>
                  <td className="px-4 py-3 text-teal-500 text-xs">{s.group}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{s.level}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.count > 0 ? (
                      <span className="font-semibold text-teal-700">{s.count}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-teal-400">
                    {s.realtors.length > 0 ? s.realtors.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}

// ── Item index (text → group → level) ─────────────────────────────────────────
// Mirrors ROADMAP_DATA — kept here so the admin page has no import dependency on the realtor page

const ITEM_INDEX: { text: string; group: string; level: string }[] = [
  // New Realtor
  ...["Get professional headshots","Write a compelling personal bio","Set up a Google Business Profile","Create an Instagram account (real estate focused)","Create a Facebook business page","Create or update your LinkedIn profile","Set up a personal real estate website or landing page","Post your introduction announcement on all social channels","Film and post your first property tour video","Post 3 pieces of valuable local market content on social media"].map((t) => ({ text: t, group: "Brand & online presence", level: "New Realtor" })),
  ...["Order professional business cards","Set up a dedicated real estate email address","Record a professional voicemail greeting","Download and set up the Supra eKey app","Download and set up the Touchbase app","Download the Realtor®.ca app (black logo)","Set up a CRM and load your sphere of influence (min. 50 contacts)","Write your 90-day business plan","Time-block your weekly schedule (prospecting, follow-up, admin)","Open a dedicated business bank account","Set up basic expense tracking (income vs. costs)","Send your \"I am now a Realtor®\" announcement to your sphere"].map((t) => ({ text: t, group: "Business setup", level: "New Realtor" })),
  ...["Preview 15+ active listings across your market","Complete 5 comparative market analyses (CMAs)","Study local MLS stats: avg days on market, avg price, absorption rate","Attend 3+ open houses as an observer and take notes","Choose your geographic farm area or niche","Learn your transaction process from offer to close","Build a vendor contact list (lenders, inspectors, notaries, lawyers)","Shadow an experienced agent on a listing appointment","Shadow an experienced agent on a buyer showing"].map((t) => ({ text: t, group: "Market knowledge", level: "New Realtor" })),
  ...["Make contact with every person in your sphere (call or in-person)","Ask 10 people directly for referrals or leads","Host or assist at your first open house","Knock doors in your farm area at least once","Set up a Google alert for your farm neighborhood","Book your first buyer consultation","Book your first listing appointment (even if it does not convert)","Generate your first 10 leads (any source)"].map((t) => ({ text: t, group: "Prospecting & lead generation", level: "New Realtor" })),
  ...["Practice your buyer consultation script 5 times (role play)","Practice your listing presentation 5 times (role play)","Complete your brokerage onboarding training fully","Attend 2 REALTOR® board or networking events","Complete 1 negotiation or objection handling course","Read 1 real estate sales or mindset book"].map((t) => ({ text: t, group: "Skills & presentations", level: "New Realtor" })),
  ...["Complete your first buyer representation agreement","Write your first offer","Take your first listing","Close your first transaction","Ask your first closed client for a written review","Get your first inbound referral from someone in your sphere"].map((t) => ({ text: t, group: "First deals", level: "New Realtor" })),
  ...["Log in to Real Academy and complete your profile","Complete the New Agent Starter Series (12-week program)","Complete 5 courses in the New Agents category","Attend 1 live Real Academy session or virtual event","Complete 4 courses of your choice in the Career Journey section"].map((t) => ({ text: t, group: "Real Academy — new agent track", level: "New Realtor" })),

  // 1–2 Years
  ...["Close 5+ transactions in a 12-month period","Take 3+ listings (seller side) in a year","Have a full pipeline 60 days out at all times","Track your lead-to-close conversion rate","Calculate your cost per lead by source","Review your production numbers monthly and adjust strategy"].map((t) => ({ text: t, group: "Production & pipeline", level: "1–2 Years" })),
  ...["Grow your CRM database to 200+ contacts","Run a consistent monthly touch campaign to your full database","Set up automated follow-up sequences for new leads","Segment your database (A, B, C clients and hot, warm, cold leads)","Track every active lead with a pipeline stage","Ask every closed client for a referral at closing"].map((t) => ({ text: t, group: "Database & CRM mastery", level: "1–2 Years" })),
  ...["Post consistently 3x per week on social media for 90 days straight","Collect 10+ Google or Zillow reviews","Launch a monthly real estate e-newsletter to your database","Run your first paid social media ad (listings or lead gen)","Film and post 5+ property tour or market update videos","Get featured in a local blog, newspaper, or community page"].map((t) => ({ text: t, group: "Marketing & brand", level: "1–2 Years" })),
  ...["Create a polished buyer presentation package","Create a polished listing presentation package","Win a listing against a competing agent","Complete a transaction with a complex negotiation (multiple offers, conditions)","Hold a first-time buyer education seminar or webinar","Master your listing price reduction conversation"].map((t) => ({ text: t, group: "Listings & buyers advanced", level: "1–2 Years" })),
  ...["Set your GCI target for year 2 higher than year 1","Set up quarterly tax payments as self-employed","Build a 3-month personal expense reserve fund","Understand your commission structure and renegotiate if eligible","Track return on investment for every marketing dollar spent","Meet with a financial advisor about retirement and wealth planning"].map((t) => ({ text: t, group: "Financial & business", level: "1–2 Years" })),
  ...["Join a mastermind, accountability group, or agent network","Build vendor relationships with 2 lenders, 2 inspectors, 1 lawyer","Receive 5+ inbound referrals in a year from your network","Attend a regional real estate conference or summit","Connect with and learn from a top producer in your market","Meet with your coach or mentor at least monthly"].map((t) => ({ text: t, group: "Network & referrals", level: "1–2 Years" })),
  ...["Complete 5 courses in the Career Journey Experienced Agent section","Attend 5 Community Masterminds on Real Academy","Complete 1 marketing or lead generation course","Attend a Beyond RISE or major Real Academy virtual event"].map((t) => ({ text: t, group: "Real Academy — experienced agent track", level: "1–2 Years" })),

  // 3–5 Years
  ...["Close 20+ transactions in a single year","Take 3+ listings (seller side) in a year","Generate 50%+ of your business from referrals and repeat clients","Achieve your target GCI consistently for 2 years in a row","Earn a top producer award at your brokerage or board","Rank in the top 10% of your local market by volume"].map((t) => ({ text: t, group: "Production & revenue", level: "3–5 Years" })),
  ...["Publish a monthly market report (written or video) for your farm","Be quoted or featured in a local media article","Speak on a panel or at a local industry event","Be recognized as the go-to agent for your neighborhood or niche","Build a neighborhood-specific social media presence or page","Host a community event or client appreciation event"].map((t) => ({ text: t, group: "Market authority", level: "3–5 Years" })),
  ...["Build an email list of 500+ past clients and warm leads","Run a consistent YouTube, Instagram Reels, or video content strategy","Launch a retargeting ad campaign to past website visitors","Track and report ROI on all marketing channels monthly","Partner with a local business for co-marketing or sponsorship","Test one new lead generation channel and measure results for 90 days"].map((t) => ({ text: t, group: "Advanced marketing", level: "3–5 Years" })),
  ...["Hire a transaction coordinator (full-time or part-time)","Hire a virtual assistant or part-time admin","Create written SOPs for your listing, buying, and closing process","Automate your follow-up and nurture sequences end to end","Build a client review request system that runs automatically","Measure your 5 most important business metrics every week"].map((t) => ({ text: t, group: "Systems & leverage", level: "3–5 Years" })),
  ...["Complete an advanced designation (ABR, SRS, CNE, SRES, etc.)","Become certified in a niche (luxury, investment, first-time buyers)","Master one lead generation channel deeply","Write or record a definitive guide to buying or selling in your market","Build a referral partnership with an out-of-market agent"].map((t) => ({ text: t, group: "Designations & specialization", level: "3–5 Years" })),
  ...["Formally mentor a newer agent at your brokerage","Explore the team vs. solo agent model with a business plan","Bring on a buyer's agent partner or admin if volume supports it","Attend a national real estate conference","Create a personal succession plan for your business"].map((t) => ({ text: t, group: "Team & mentorship", level: "3–5 Years" })),
  ...["Complete 5 courses in Career Journey Advanced or Team Leader section","Attend 5 additional Community Masterminds","Complete a course on team building or agent attraction","Attend a Real Brokerage all-agent event such as RISE","Contribute or present content in a Real community session"].map((t) => ({ text: t, group: "Real Academy — leadership track", level: "3–5 Years" })),

  // 5+ Years
  ...["Build a team of 2+ licensed agents with a written team agreement","Create an agent onboarding and training program for your team","Define your team model (rainmaker, partner-based, etc.)","Hit a team GCI milestone ($500K, $1M, or your personal target)","Hire a dedicated marketing coordinator or agency","Develop your team culture, values, and vision document"].map((t) => ({ text: t, group: "Scale & team", level: "5+ Years" })),
  ...["Hire a professional real estate coach (Tom Ferry, Ninja Selling, etc.)","Join a peer accountability group or mastermind at the national level","Set a formal coaching goal and track it monthly for a full year","Invest in at least one business retreat or intensive per year","Read or listen to 12+ business or leadership books per year"].map((t) => ({ text: t, group: "Coaching & accountability", level: "5+ Years" })),
  ...["Purchase your first investment property","Analyze deals using cap rate and cash-on-cash return","Build a relationship with an investor-focused lender","Join a local real estate investors group or association","Explore commercial real estate or multi-family opportunities","Build a personal real estate investment portfolio plan"].map((t) => ({ text: t, group: "Real estate investing", level: "5+ Years" })),
  ...["Max out RRSP or IRA or retirement contributions annually","Build 12+ months of personal expense reserves","Create or update your will and estate plan with an advisor","Develop a passive income strategy (rentals, coaching, referrals)","Work with a financial planner to create a net worth roadmap","Define your retirement target and reverse-engineer the plan"].map((t) => ({ text: t, group: "Wealth & financial independence", level: "5+ Years" })),
  ...["Publish a book, course, or coaching program for other agents","Speak at a national conference or industry event","Be recognized in a top agent publication, award, or ranking","Build a social media audience of 5000+ engaged followers","Launch a podcast, YouTube channel, or newsletter with regular cadence","Create content or intellectual property that outlasts your production"].map((t) => ({ text: t, group: "Authority & influence", level: "5+ Years" })),
  ...["Formally mentor 3+ agents through their first year","Donate a percentage of commissions to a cause you believe in","Volunteer with or sponsor a housing-related nonprofit","Advocate for real estate or housing policy at the local or national level","Participate in or organize a charitable real estate event","Define your personal legacy statement for your career"].map((t) => ({ text: t, group: "Giving back & legacy", level: "5+ Years" })),
  ...["Complete 5 advanced leadership or scaling courses","Present or co-host a session in the Real Academy community","Attend 5 masterminds focused on team or brokerage growth","Complete a Real agent attraction or revenue share course"].map((t) => ({ text: t, group: "Real Academy — elite track", level: "5+ Years" })),
];
