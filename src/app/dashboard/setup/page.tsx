"use client";

// src/app/dashboard/setup/page.tsx — Initial Setup Overview

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

const SYSSETUP_TOTAL = 11; // 6 platforms + 5 guides

// ── Helpers ────────────────────────────────────────────────────────────────────

type RealtorWithNotices = Realtor & { read_notices?: string[] };

function greeting(pct: number): string {
  if (pct === 0)    return "Welcome to Creativ Realty. Let\u2019s get you set up.";
  if (pct <= 25)    return "Great start \u2014 you\u2019re on your way.";
  if (pct <= 50)    return "Good momentum. Keep going.";
  if (pct <= 75)    return "More than halfway there. Strong work.";
  if (pct < 100)    return "Almost fully set up. Finish strong.";
  return "You\u2019re all set up. Time to sell.";
}

function ProgressBar({ pct, thick }: { pct: number; thick?: boolean }) {
  return (
    <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${thick ? "h-4" : "h-2"}`}>
      <div
        className="h-full bg-[#0D5C63] rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

interface CardProps {
  icon:     string;
  title:    string;
  done:     number;
  total:    number;
  label:    string;
  href:     string;
  linkText: string;
}

function Card({ icon, title, done, total, label, href, linkText }: CardProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl" role="img" aria-label={title}>{icon}</span>
        <h3 className="text-sm font-semibold text-[#0D5C63]">{title}</h3>
        <span className="ml-auto text-xs font-semibold text-[#0D5C63]">{pct}%</span>
      </div>

      <ProgressBar pct={pct} />

      <p className="text-xs text-teal-600">{label}</p>

      <Link
        href={href}
        className="text-xs font-medium text-[#0D5C63] hover:underline mt-auto"
      >
        {linkText} &rarr;
      </Link>
    </div>
  );
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
  const readNotices = realtor?.read_notices ?? [];
  const noticesDone = readNotices.length;

  // First 90 Days
  const first90Done  = FIRST_90_ITEMS.filter((text) => completed.has(text)).length;
  const first90Total = FIRST_90_ITEMS.length;

  // Overall %
  const licensingPct = licensingTotal > 0 ? (licensingDone / licensingTotal) * 100 : 0;
  const syssetupPct  = (syssetupDone / SYSSETUP_TOTAL) * 100;
  const noticesPct   = totalNotices > 0 ? (noticesDone / totalNotices) * 100 : 100;
  const first90Pct   = first90Total > 0 ? (first90Done / first90Total) * 100 : 0;
  const overallPct   = Math.round((licensingPct + syssetupPct + noticesPct + first90Pct) / 4);

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-[#0D5C63]">Initial Setup</h1>
            <p className="text-sm text-teal-500 mt-1">Your onboarding at a glance.</p>
          </div>

          {/* Greeting */}
          <p className="text-base font-medium text-[#0D5C63] mb-6">{greeting(overallPct)}</p>

          {/* 2×2 card grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card
              icon="📋"
              title="Licensing"
              done={licensingDone}
              total={licensingTotal}
              label={`${licensingDone} of ${licensingTotal} steps completed`}
              href="/dashboard/licensing"
              linkText="Go to Licensing"
            />
            <Card
              icon="🔧"
              title="Systems Setup"
              done={syssetupDone}
              total={SYSSETUP_TOTAL}
              label={`${syssetupDone} of ${SYSSETUP_TOTAL} items set up`}
              href="/dashboard/systems"
              linkText="Go to Systems Setup"
            />
            <Card
              icon="🔔"
              title="Notices"
              done={noticesDone}
              total={totalNotices}
              label={totalNotices === 0 ? "No notices yet" : `${noticesDone} of ${totalNotices} notices read`}
              href="/dashboard/notices"
              linkText="Go to Notices"
            />
            <Card
              icon="🗓️"
              title="Your First 90 Days"
              done={first90Done}
              total={first90Total}
              label={`${first90Done} of ${first90Total} milestones hit`}
              href="/dashboard/roadmap"
              linkText="Go to Roadmap"
            />
          </div>

          {/* Overall bar */}
          <div className="bg-white border border-[#B2DFDB] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0D5C63]">Overall Onboarding Progress</h2>
              <span className="text-sm font-bold text-[#0D5C63]">{overallPct}%</span>
            </div>
            <ProgressBar pct={overallPct} thick />
            <p className="text-xs text-teal-500 mt-2">Average across Licensing, Systems, Notices, and First 90 Days</p>
          </div>

        </div>
      </main>
    </div>
  );
}
