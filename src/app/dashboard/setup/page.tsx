"use client";

// src/app/dashboard/setup/page.tsx — Initial Setup Overview 2.0

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, getNotices, Realtor } from "@/lib/api";

// ── First 90 Days item texts (must match roadmap page exactly) ─────────────────

const FIRST_90_ITEMS = [
  // Foundation
  "Complete your NBREA membership application",
  "Submit your FCNB licence application under Creativ Realty",
  "Log in to Matrix (MLS) and explore your first listing search",
  "Set up Transaction Desk and read the Intro to Transaction Desk guide",
  "Add your sphere of influence to your CRM (minimum 50 contacts)",
  // Outreach
  "Contact every person in your sphere by phone or in-person",
  "Preview 10 active listings in your target area",
  "Complete 3 comparative market analyses (CMAs)",
  "Attend an open house as an observer and take notes",
  "Book your first buyer or seller consultation",
  // Growth
  "Write your first offer or take your first listing",
  "Post your agent introduction on all social channels",
  "Set up your Google Business Profile",
  "Choose your niche and complete the niche checklist",
  "Write your 90-day business plan and share it with your coach",
];

const SYSSETUP_TOTAL = 6; // 6 active platforms (Rezen is coming soon)

// ── Helpers ────────────────────────────────────────────────────────────────────

type RealtorWithNotices = Realtor & { read_notices?: string[] };

function ProgressBar({ pct, thick }: { pct: number; thick?: boolean }) {
  return (
    <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${thick ? "h-3" : "h-1.5"}`}>
      <div
        className="h-full bg-[#0D5C63] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Card icons (SVG, no emoji) ─────────────────────────────────────────────────

function IconLicensing() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#0D5C63]">
      <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconSystems() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#0D5C63]">
      <rect x="1" y="3" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 14h4M8 12v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconNotices() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#0D5C63]">
      <path d="M8 1a5 5 0 015 5v2l1 2H2l1-2V6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#0D5C63]">
      <rect x="1" y="3" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 7h14M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

interface CardData {
  icon:     React.ReactNode;
  title:    string;
  done:     number;
  total:    number;
  label:    string;
  href:     string;
  linkText: string;
}

function ProgressCard({ icon, title, done, total, label, href, linkText }: CardData) {
  const pct        = total > 0 ? Math.round((done / total) * 100) : 0;
  const hasProgress = done > 0;
  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3
                     border border-[#B2DFDB] border-t-2
                     ${hasProgress ? "border-t-[#0D5C63]" : "border-t-slate-200"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#F0FAFA] p-2 rounded-lg">
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        </div>
        <span className="text-sm font-bold text-[#0D5C63]">{pct}%</span>
      </div>

      <ProgressBar pct={pct} />

      <p className="text-xs text-slate-500">{label}</p>

      <Link
        href={href}
        className="text-xs font-medium text-[#0D5C63] hover:underline mt-auto"
      >
        {linkText} →
      </Link>
    </div>
  );
}

// ── Next step logic ────────────────────────────────────────────────────────────

interface NextStep {
  heading:     string;
  description: string;
  href:        string;
  cta:         string;
}

function getNextStep(
  licensingPct: number,
  syssetupPct:  number,
  unreadNotices: number,
  first90Pct:   number
): NextStep {
  if (licensingPct < 100) {
    return {
      heading:     "Complete your licensing application",
      description: "Your licence is the foundation. Finish your NBREA and FCNB applications to get started.",
      href:        "/dashboard/licensing",
      cta:         "Go to Licensing",
    };
  }
  if (syssetupPct < 100) {
    return {
      heading:     "Set up your core platforms",
      description: "Get connected to Matrix, Transaction Desk, PAOL, and the other tools you'll use every day.",
      href:        "/dashboard/systems",
      cta:         "Go to Systems Setup",
    };
  }
  if (unreadNotices > 0) {
    return {
      heading:     "Catch up on team notices",
      description: `You have ${unreadNotices} unread notice${unreadNotices > 1 ? "s" : ""} from your coach.`,
      href:        "/dashboard/notices",
      cta:         "Read Notices",
    };
  }
  if (first90Pct < 100) {
    return {
      heading:     "Work through your First 90 Days",
      description: "Keep knocking off your 90-day milestones. Every one moves you closer to your first deal.",
      href:        "/dashboard/roadmap",
      cta:         "Go to Roadmap",
    };
  }
  return {
    heading:     "You're all set up.",
    description: "Your onboarding is complete. Head to My Coaching to plan your week.",
    href:        "/dashboard/week",
    cta:         "Go to My Week",
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,      setRealtor]      = useState<RealtorWithNotices | null>(null);
  const [totalNotices, setTotalNotices] = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    (async () => {
      try {
        const [r, notices] = await Promise.all([
          getRealtorByEmail(email),
          getNotices("realtors"),
        ]);
        if (!r) { router.push("/"); return; }
        setRealtor(r as RealtorWithNotices);
        setTotalNotices(notices.length);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F0FAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const completed = new Set(realtor?.roadmap_completed ?? []);

  // Licensing: use whichever path has more progress
  const licensingNewDone  = ["licensing_new_1", "licensing_new_2", "licensing_new_3"]
    .filter((k) => completed.has(k)).length;
  const licensingXferDone = ["licensing_xfer_1", "licensing_xfer_2", "licensing_xfer_3", "licensing_xfer_4"]
    .filter((k) => completed.has(k)).length;
  const licensingDone  = Math.max(licensingNewDone, licensingXferDone);
  const licensingTotal = licensingXferDone > licensingNewDone ? 4 : 3;

  // Systems Setup
  const syssetupDone = Array.from(completed).filter((k) => k.startsWith("syssetup_")).length;

  // Notices
  const readNotices  = realtor?.read_notices ?? [];
  const noticesDone  = readNotices.length;
  const unreadCount  = Math.max(0, totalNotices - noticesDone);

  // First 90 Days
  const first90Done  = FIRST_90_ITEMS.filter((text) => completed.has(text)).length;
  const first90Total = FIRST_90_ITEMS.length;

  // Section percentages
  const licensingPct = licensingTotal > 0 ? Math.round((licensingDone / licensingTotal) * 100) : 0;
  const syssetupPct  = Math.round((syssetupDone / SYSSETUP_TOTAL) * 100);
  const noticesPct   = totalNotices > 0 ? Math.round((noticesDone / totalNotices) * 100) : 100;
  const first90Pct   = first90Total > 0 ? Math.round((first90Done / first90Total) * 100) : 0;
  const overallPct   = Math.round((licensingPct + syssetupPct + noticesPct + first90Pct) / 4);

  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const nextStep  = getNextStep(licensingPct, syssetupPct, unreadCount, first90Pct);

  const cards: CardData[] = [
    {
      icon:     <IconLicensing />,
      title:    "Licensing",
      done:     licensingDone,
      total:    licensingTotal,
      label:    `${licensingDone} of ${licensingTotal} steps completed`,
      href:     "/dashboard/licensing",
      linkText: "Go to Licensing",
    },
    {
      icon:     <IconSystems />,
      title:    "Systems Setup",
      done:     syssetupDone,
      total:    SYSSETUP_TOTAL,
      label:    `${syssetupDone} of ${SYSSETUP_TOTAL} platforms set up`,
      href:     "/dashboard/systems",
      linkText: "Go to Systems Setup",
    },
    {
      icon:     <IconNotices />,
      title:    "Notices",
      done:     noticesDone,
      total:    totalNotices,
      label:    totalNotices === 0 ? "No notices yet" : `${noticesDone} of ${totalNotices} notices read`,
      href:     "/dashboard/notices",
      linkText: "Go to Notices",
    },
    {
      icon:     <IconCalendar />,
      title:    "Your First 90 Days",
      done:     first90Done,
      total:    first90Total,
      label:    `${first90Done} of ${first90Total} milestones hit`,
      href:     "/dashboard/roadmap",
      linkText: "Go to Roadmap",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* ── 1. Welcome Hero ─────────────────────────────────────────────────── */}
        <div className="py-8 px-2">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0D5C63] leading-tight">
            {firstName
              ? `Welcome to Real Estate, ${firstName}.`
              : "Welcome to Real Estate."}
          </h1>
          <p className="text-lg text-slate-600 mt-3 max-w-2xl">
            You&apos;re starting a career that can take you anywhere. This is where we help you build the foundation.
          </p>
        </div>

        {/* ── 2. Your Next Step card ──────────────────────────────────────────── */}
        <div className="mt-8 bg-gradient-to-br from-white to-[#FFF8F5] border border-[#B2DFDB] border-l-4 border-l-[#FF6B35] rounded-xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">
            Your Next Step
          </p>
          <h2 className="text-lg font-semibold text-slate-800 mb-1">{nextStep.heading}</h2>
          <p className="text-sm text-slate-500 mb-4">{nextStep.description}</p>
          <Link
            href={nextStep.href}
            className="inline-block bg-[#FF6B35] hover:bg-[#E85A24] text-white text-sm font-medium
                       px-5 py-2.5 rounded-lg transition-colors"
          >
            {nextStep.cta}
          </Link>
        </div>

        {/* ── 3. Section header ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Onboarding</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">Track your progress</h2>
        </div>

        {/* ── 4. 4 Progress cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {cards.map((card) => (
            <ProgressCard key={card.title} {...card} />
          ))}
        </div>

        {/* ── 5. Overall bar ──────────────────────────────────────────────────── */}
        <div className="mt-6 bg-white border border-[#B2DFDB] rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Overall Onboarding Progress</h2>
            <span className="text-sm font-bold text-[#0D5C63]">{overallPct}%</span>
          </div>
          <ProgressBar pct={overallPct} thick />
          <p className="text-xs text-slate-400 mt-2">
            Average across Licensing, Systems, Notices, and First 90 Days
          </p>
        </div>

      </main>
    </div>
  );
}
