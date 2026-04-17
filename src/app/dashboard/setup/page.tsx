"use client";

// src/app/dashboard/setup/page.tsx — Initial Setup Overview

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileCheck,
  LayoutGrid,
  Tag,
  Mail,
  Link2,
  Bell,
  Target,
  ArrowRight,
  Sparkles,
  Check,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, getNotices, Realtor } from "@/lib/api";

// ── First 90 Days item texts (must match roadmap page exactly) ─────────────────

const FIRST_90_ITEMS = [
  "Complete your NBREA membership application",
  "Submit your FCNB licence application under Creativ Realty",
  "Log in to Matrix (MLS) and explore your first listing search",
  "Set up Transaction Desk and read the Intro to Transaction Desk guide",
  "Add your sphere of influence to your CRM (minimum 50 contacts)",
  "Contact every person in your sphere by phone or in-person",
  "Preview 10 active listings in your target area",
  "Complete 3 comparative market analyses (CMAs)",
  "Attend an open house as an observer and take notes",
  "Book your first buyer or seller consultation",
  "Write your first offer or take your first listing",
  "Post your agent introduction on all social channels",
  "Set up your Google Business Profile",
  "Choose your niche and complete the niche checklist",
  "Write your 90-day business plan and share it with your coach",
];

const SYSSETUP_TOTAL = 6;
const SWAG_KEYS = [
  "swag_business_cards",
  "swag_listing_signs",
  "swag_open_house_signs",
  "swag_name_badge",
  "swag_digital_templates",
  "swag_brand_guidelines_reviewed",
];

const RING_R          = 32;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R; // ≈ 201.06

// ── Types ──────────────────────────────────────────────────────────────────────

type RealtorWithNotices = Realtor & { read_notices?: string[] };

interface TileData {
  icon:     React.ReactNode;
  title:    string;
  pct:      number;
  href:     string;
  label:    string;
  accent:   string;
  subtitle: string;
}

interface NextStep {
  label:       string;
  heading:     string;
  description: string;
  href:        string;
  cta:         string;
}

// ── Computed progress helpers ──────────────────────────────────────────────────

function computeEmailPct(completed: Set<string>): number {
  if (completed.has("email_completed")) return 100;
  let score = 0;
  if (Array.from(completed).some((k) => k.startsWith("email_path:"))) score += 34;
  if (Array.from(completed).some((k) => k.startsWith("email_addr:"))) score += 33;
  if (completed.has("email_old_handled") || completed.has("email_old_skipped")) score += 33;
  return score;
}

function computeSwagPct(completed: Set<string>): number {
  if (completed.has("swag_completed")) return 100;
  const done = SWAG_KEYS.filter((k) => completed.has(k)).length;
  return Math.round((done / SWAG_KEYS.length) * 100);
}

function computeRealLinksPct(completed: Set<string>): number {
  if (completed.has("real_links_completed")) return 100;
  if (completed.has("real_links_bookmarked")) return 50;
  return 0;
}

function getNextStep(
  licensingPct:  number,
  syssetupPct:   number,
  emailPct:      number,
  swagPct:       number,
  realLinksPct:  number,
  unreadNotices: number,
  first90Pct:    number,
): NextStep {
  if (licensingPct < 100) return {
    label:       "LICENSING",
    heading:     "Complete your licence application",
    description: "Your licence is the foundation. Finish your NBREA and FCNB applications to get started as an agent.",
    href:        "/dashboard/licensing",
    cta:         "Go to Licensing",
  };
  if (syssetupPct < 100) return {
    label:       "SYSTEMS SETUP",
    heading:     "Get connected to your core platforms",
    description: "Set up Matrix, PAOL, Supra eKey, and the other tools you'll use every single day.",
    href:        "/dashboard/systems",
    cta:         "Go to Systems Setup",
  };
  if (emailPct < 100) return {
    label:       "EMAIL SETUP",
    heading:     "Set up your professional email",
    description: "Choose between a personal or business address and get your inbox ready for clients.",
    href:        "/dashboard/email-setup",
    cta:         "Go to Email Setup",
  };
  if (swagPct < 100) return {
    label:       "SIGNS & SWAG",
    heading:     "Order your signs and branding",
    description: "Get your listing signs, business cards, and brand materials ordered before your first deal.",
    href:        "/dashboard/signs-swag",
    cta:         "Go to Signs & Swag",
  };
  if (realLinksPct < 100) return {
    label:       "REAL LINKS",
    heading:     "Bookmark your agent portals",
    description: "Save your key links — reZEN, Marketing Center, Real Academy — so they're always one click away.",
    href:        "/dashboard/real-links",
    cta:         "Go to REAL Links",
  };
  if (unreadNotices > 0) return {
    label:       "NOTICES",
    heading:     `You have ${unreadNotices} unread notice${unreadNotices > 1 ? "s" : ""}`,
    description: "Your coach has posted updates for you. Take a few minutes to catch up.",
    href:        "/dashboard/notices",
    cta:         "Read Notices",
  };
  if (first90Pct < 100) return {
    label:       "FIRST 90 DAYS",
    heading:     "Work through your First 90 Days",
    description: "Keep knocking off your 90-day milestones. Every one moves you closer to your first deal.",
    href:        "/dashboard/roadmap",
    cta:         "Go to Roadmap",
  };
  return {
    label:       "COMPLETE",
    heading:     "Your onboarding is complete.",
    description: "You've finished every step. Head to My Coaching to plan your week and keep building momentum.",
    href:        "/dashboard/week",
    cta:         "Go to My Week",
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  const filled = (displayed / 100) * RING_CIRCUMFERENCE;

  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80">
        {/* Track */}
        <circle
          cx="40" cy="40" r={RING_R}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          cx="40" cy="40" r={RING_R}
          fill="none"
          stroke="#0D5C63"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${RING_CIRCUMFERENCE}`}
          transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[#0D5C63] tabular-nums leading-none">{pct}%</span>
        <span className="text-[10px] text-slate-500 mt-0.5">overall</span>
      </div>
    </div>
  );
}

function Tile({ icon, title, pct, href, accent, subtitle }: TileData) {
  const done       = pct === 100;
  const inProgress = pct > 0 && pct < 100;

  // Icon container background
  const iconBgStyle = done
    ? { backgroundColor: "#10B981" }
    : inProgress
    ? { backgroundColor: accent }
    : { backgroundColor: accent + "1A" }; // 10% opacity

  const iconContent = done
    ? <Check size={18} className="text-white" />
    : <span style={{ color: done || inProgress ? "#fff" : accent }}>{icon}</span>;

  const cardStyle: React.CSSProperties = done
    ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
    : { backgroundColor: accent + "0A", border: "1px solid " + accent + "22" };

  return (
    <Link
      href={href}
      className="group relative rounded-xl p-4 flex flex-col shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 transition-all duration-200"
      style={cardStyle}
    >
      {/* Top row: icon + percentage/badge */}
      <div className="flex items-start justify-between">
        {/* Icon container */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={iconBgStyle}
        >
          {iconContent}
        </div>

        {/* Percentage / badge */}
        {done ? (
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#10B981" }}
          >
            <Check size={11} className="text-white" />
          </span>
        ) : inProgress ? (
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: accent }}
          >
            {pct}%
          </span>
        ) : (
          <span className="text-xs font-semibold text-slate-400">Not started</span>
        )}
      </div>

      {/* Title + subtitle */}
      <div className="mt-3">
        <p className="text-sm font-semibold text-[#0F172A] leading-tight">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Progress bar — only if pct > 0 */}
      {pct > 0 && (
        <div className="mt-auto pt-3">
          <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: done ? "#10B981" : accent,
              }}
            />
          </div>
        </div>
      )}
    </Link>
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
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Computed values ──────────────────────────────────────────────────────────

  const completed = new Set(realtor?.roadmap_completed ?? []);

  // Licensing
  const licensingNewDone  = ["licensing_new_1",  "licensing_new_2",  "licensing_new_3"]
    .filter((k) => completed.has(k)).length;
  const licensingXferDone = ["licensing_xfer_1", "licensing_xfer_2", "licensing_xfer_3", "licensing_xfer_4"]
    .filter((k) => completed.has(k)).length;
  const licensingDone  = Math.max(licensingNewDone, licensingXferDone);
  const licensingTotal = licensingXferDone > licensingNewDone ? 4 : 3;
  const licensingPct   = licensingTotal > 0 ? Math.round((licensingDone / licensingTotal) * 100) : 0;

  // Systems
  const syssetupDone = Array.from(completed).filter((k) => k.startsWith("syssetup_")).length;
  const syssetupPct  = Math.round((syssetupDone / SYSSETUP_TOTAL) * 100);

  // Email
  const emailPct = computeEmailPct(completed);

  // Signs & Swag
  const swagPct = computeSwagPct(completed);

  // REAL Links
  const realLinksPct = computeRealLinksPct(completed);

  // Notices
  const readNotices = realtor?.read_notices ?? [];
  const noticesDone = readNotices.length;
  const unreadCount = Math.max(0, totalNotices - noticesDone);
  const noticesPct  = totalNotices > 0 ? Math.round((noticesDone / totalNotices) * 100) : 100;

  // First 90 Days
  const first90Done  = FIRST_90_ITEMS.filter((text) => completed.has(text)).length;
  const first90Total = FIRST_90_ITEMS.length;
  const first90Pct   = first90Total > 0 ? Math.round((first90Done / first90Total) * 100) : 0;

  // Overall (average of all 7 sections)
  const overallPct = Math.round(
    (licensingPct + syssetupPct + emailPct + swagPct + realLinksPct + noticesPct + first90Pct) / 7
  );

  // Completed areas count (for hero sub-line)
  const completedAreas = [
    licensingPct === 100,
    syssetupPct === 100,
    emailPct === 100,
    swagPct === 100,
    realLinksPct === 100,
    totalNotices > 0 && noticesPct === 100,
    first90Pct === 100,
  ].filter(Boolean).length;

  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const nextStep  = getNextStep(
    licensingPct, syssetupPct, emailPct, swagPct, realLinksPct, unreadCount, first90Pct
  );

  // Dynamic welcome context
  const welcomeContext =
    overallPct === 0   ? "Let's get started." :
    overallPct <= 30   ? "Good momentum."       :
    overallPct <= 70   ? "Making real progress." :
    overallPct < 100   ? "Almost there."         :
                         "You're all set.";

  // Dynamic hero h1 text
  const heroStatement =
    overallPct === 0   ? "Ready to get started?" :
    overallPct <= 50   ? `You're ${overallPct}% of the way to your first deal.` :
    overallPct < 100   ? `You're ${overallPct}% there. Keep the momentum.` :
                         "You're fully set up.";

  const tiles: TileData[] = [
    {
      icon:     <FileCheck size={18} />,
      title:    "Licensing",
      pct:      licensingPct,
      href:     "/dashboard/licensing",
      label:    `${licensingDone} of ${licensingTotal} steps`,
      accent:   "#3B82F6",
      subtitle: "New licence or transfer",
    },
    {
      icon:     <LayoutGrid size={18} />,
      title:    "Systems Setup",
      pct:      syssetupPct,
      href:     "/dashboard/systems",
      label:    `${syssetupDone} of ${SYSSETUP_TOTAL} platforms`,
      accent:   "#8B5CF6",
      subtitle: "6 core platforms",
    },
    {
      icon:     <Tag size={18} />,
      title:    "Signs & Swag",
      pct:      swagPct,
      href:     "/dashboard/signs-swag",
      label:    swagPct === 100 ? "Complete" : `${Math.round((swagPct / 100) * SWAG_KEYS.length)} of ${SWAG_KEYS.length} items`,
      accent:   "#F97316",
      subtitle: "Cards, signs, branding",
    },
    {
      icon:     <Mail size={18} />,
      title:    "Email Setup",
      pct:      emailPct,
      href:     "/dashboard/email-setup",
      label:    emailPct === 100 ? "Complete" : emailPct > 0 ? "In progress" : "Not started",
      accent:   "#6366F1",
      subtitle: "Personal or business",
    },
    {
      icon:     <Link2 size={18} />,
      title:    "REAL Links",
      pct:      realLinksPct,
      href:     "/dashboard/real-links",
      label:    realLinksPct === 100 ? "Complete" : realLinksPct === 50 ? "Bookmarked" : "Not started",
      accent:   "#14B8A6",
      subtitle: "Real Brokerage directory",
    },
    {
      icon:     <Bell size={18} />,
      title:    "Notices",
      pct:      noticesPct,
      href:     "/dashboard/notices",
      label:    totalNotices === 0 ? "No notices yet" : `${noticesDone} of ${totalNotices} read`,
      accent:   "#F59E0B",
      subtitle: "Team updates",
    },
    {
      icon:     <Target size={18} />,
      title:    "First 90 Days",
      pct:      first90Pct,
      href:     "/dashboard/roadmap",
      label:    `${first90Done} of ${first90Total} milestones`,
      accent:   "#10B981",
      subtitle: "Your ramp-up plan",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <Sidebar role="realtor" />

      <main className="flex-1 px-8 pt-8 pb-12 overflow-auto">

        {/* ── 1. Compact welcome bar ────────────────────────────────────────── */}
        <div className="pb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Initial Setup
          </p>
          <p className="text-xl font-semibold text-[#0F172A]">
            {firstName ? `Hey, ${firstName}.` : "Hey."}{" "}
            <span className="font-normal text-slate-500">{welcomeContext}</span>
          </p>
        </div>

        {/* ── 2. Progress hero card ─────────────────────────────────────────── */}
        <div
          className="mt-4 bg-gradient-to-br from-[#F0FAFA] via-[#F0FAFA] to-[#E8F4F8] rounded-2xl shadow-soft-lg p-6 md:p-8"
          style={{ backgroundColor: "#F0FAFA", border: "1px solid #B2DFDB" }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            {/* Left */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Your Onboarding
              </p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0F172A] mt-2 leading-snug">
                {heroStatement}
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                {completedAreas} of 7 areas complete · {7 - completedAreas} to go
              </p>
            </div>

            {/* Right — circular progress ring */}
            <ProgressRing pct={overallPct} />

          </div>
        </div>

        {/* ── 3. Up Next card ───────────────────────────────────────────────── */}
        <div
          className="mt-4 border-l-4 border-l-[#FF6B35] rounded-xl shadow-soft p-4 md:p-5"
          style={{
            backgroundColor: "#FFF8F3",
            borderTop: "1px solid #FFE4D1",
            borderRight: "1px solid #FFE4D1",
            borderBottom: "1px solid #FFE4D1",
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wider text-[#FF6B35] uppercase">
                Up Next
              </p>
              <p className="text-base md:text-lg font-semibold text-[#0F172A] mt-0.5 truncate">
                {nextStep.heading}
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href={nextStep.href}
                className="inline-flex items-center gap-1.5 bg-[#FF6B35] hover:bg-[#E85A24]
                           text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                {nextStep.cta}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 4. Tile grid ──────────────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase mb-4">
            Your Areas
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

            {tiles.map((tile) => (
              <Tile key={tile.title} {...tile} />
            ))}

            {/* Ghost 8th tile — hidden on mobile */}
            <div
              className="hidden md:flex rounded-xl shadow-none p-4 flex-col items-center justify-center cursor-default opacity-60 min-h-[110px]"
              style={{ backgroundColor: "#FFFFFF80", border: "1px dashed #E2E8F0" }}
            >
              <Sparkles size={16} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 italic text-center">More coming soon</p>
            </div>

          </div>
        </div>

        {/* ── 5. Career path card ───────────────────────────────────────────── */}
        <div
          className="mt-12 rounded-2xl shadow-soft p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          style={{ backgroundColor: "#FAFAF7", border: "1px solid #E7E5DE" }}
        >
          <div>
            <p className="text-xs font-semibold text-[#0D5C63] uppercase tracking-widest">
              My Coaching
            </p>
            <h2 className="text-lg font-bold text-[#0F172A] mt-1">Your career path is waiting.</h2>
            <p className="text-sm text-slate-600 mt-1">
              Once you&apos;re set up, My Career Path takes you through Year 1 to Year 5+ as a Creativ agent.
            </p>
          </div>
          <Link
            href="/dashboard/roadmap"
            className="shrink-0 inline-flex items-center gap-2 bg-[#0D5C63] hover:bg-[#064E56]
                       text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Preview My Career Path
            <ArrowRight size={16} />
          </Link>
        </div>

      </main>
    </div>
  );
}
