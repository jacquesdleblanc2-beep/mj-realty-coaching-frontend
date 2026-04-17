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
  ChevronRight,
  ArrowRight,
  Sparkles,
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

// ── Types ──────────────────────────────────────────────────────────────────────

type RealtorWithNotices = Realtor & { read_notices?: string[] };

interface TileData {
  icon:    React.ReactNode;
  title:   string;
  pct:     number;
  href:    string;
  label:   string;
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

function ThinBar({
  pct,
  trackColor,
  fillColor,
}: {
  pct: number;
  trackColor: string;
  fillColor: string;
}) {
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: trackColor }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: fillColor }}
      />
    </div>
  );
}

function AnimatedOverallBar({ pct }: { pct: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplayed(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${displayed}%`,
          background: "linear-gradient(to right, #0D5C63, #14808A)",
        }}
      />
    </div>
  );
}

function Tile({ icon, title, pct, href, label }: TileData) {
  const done       = pct === 100;
  const inProgress = pct > 0 && pct < 100;

  const containerClass = done
    ? "bg-[#ECFDF5] border border-[#A7F3D0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    : inProgress
    ? "bg-[#E0F2F1] border border-[#B2DFDB] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    : "bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-[#B2DFDB] transition-all duration-200";

  const iconBg    = done ? "bg-[#059669]" : inProgress ? "bg-[#0D5C63]" : "bg-[#F0FAFA]";
  const iconColor = done || inProgress ? "text-white" : "text-[#0D5C63]";

  const pctClass  = done
    ? "text-xl font-bold tabular-nums text-[#059669]"
    : inProgress
    ? "text-xl font-bold tabular-nums text-[#0D5C63]"
    : "text-xl font-bold tabular-nums text-slate-400";

  const trackColor = done ? "#A7F3D0" : inProgress ? "#B2DFDB" : "#F1F5F9";
  const fillColor  = done ? "#059669" : inProgress ? "#0D5C63" : "#CBD5E1";

  return (
    <Link
      href={href}
      className={`group relative rounded-2xl p-5 flex flex-col gap-3 ${containerClass}`}
    >
      {/* Completed badge */}
      {done && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#059669]/20 flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-[#059669]" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}

      {/* Icon */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>

      {/* Percentage */}
      <span className={pctClass}>{pct}%</span>

      {/* Title + subtitle */}
      <div>
        <p className="text-base font-semibold text-[#0F172A] leading-tight">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>

      {/* Progress bar */}
      <ThinBar pct={pct} trackColor={trackColor} fillColor={fillColor} />

      {/* Arrow on hover */}
      <ChevronRight
        size={14}
        className="absolute bottom-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
      />
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

  const firstName = (session?.user?.name ?? "").split(" ")[0];
  const nextStep  = getNextStep(
    licensingPct, syssetupPct, emailPct, swagPct, realLinksPct, unreadCount, first90Pct
  );

  const tiles: TileData[] = [
    {
      icon:  <FileCheck size={20} />,
      title: "Licensing",
      pct:   licensingPct,
      href:  "/dashboard/licensing",
      label: `${licensingDone} of ${licensingTotal} steps`,
    },
    {
      icon:  <LayoutGrid size={20} />,
      title: "Systems Setup",
      pct:   syssetupPct,
      href:  "/dashboard/systems",
      label: `${syssetupDone} of ${SYSSETUP_TOTAL} platforms`,
    },
    {
      icon:  <Mail size={20} />,
      title: "Email Setup",
      pct:   emailPct,
      href:  "/dashboard/email-setup",
      label: emailPct === 100 ? "Complete" : emailPct > 0 ? "In progress" : "Not started",
    },
    {
      icon:  <Tag size={20} />,
      title: "Signs & Swag",
      pct:   swagPct,
      href:  "/dashboard/signs-swag",
      label: swagPct === 100 ? "Complete" : `${Math.round((swagPct / 100) * SWAG_KEYS.length)} of ${SWAG_KEYS.length} items`,
    },
    {
      icon:  <Link2 size={20} />,
      title: "REAL Links",
      pct:   realLinksPct,
      href:  "/dashboard/real-links",
      label: realLinksPct === 100 ? "Complete" : realLinksPct === 50 ? "Bookmarked" : "Not started",
    },
    {
      icon:  <Bell size={20} />,
      title: "Notices",
      pct:   noticesPct,
      href:  "/dashboard/notices",
      label: totalNotices === 0 ? "No notices yet" : `${noticesDone} of ${totalNotices} read`,
    },
    {
      icon:  <Target size={20} />,
      title: "First 90 Days",
      pct:   first90Pct,
      href:  "/dashboard/roadmap",
      label: `${first90Done} of ${first90Total} milestones`,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* ── 1. Hero greeting ──────────────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 bg-gradient-to-br from-[#F0FAFA] via-[#FAF8F3] to-[#FFF8F0] rounded-2xl p-6 mb-1">
          <div>
            <p className="text-xs font-semibold text-[#0D5C63]/60 uppercase tracking-widest mb-1">
              Initial Setup
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] leading-tight">
              {firstName ? `Welcome, ${firstName}.` : "Welcome."}
            </h1>
            <p className="text-base text-slate-600 mt-2">
              Your onboarding dashboard — track every step before your first deal.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-[#0D5C63] tabular-nums leading-none">{overallPct}%</p>
            <p className="text-xs text-slate-500 mt-0.5">overall</p>
          </div>
        </div>

        {/* ── 2. Overall progress bar ───────────────────────────────────────── */}
        <div className="mt-3 mb-8">
          <AnimatedOverallBar pct={overallPct} />
        </div>

        {/* ── 3. UP NEXT card ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF7F50] to-[#FF8956] p-4 md:p-5 mb-8 shadow-lg shadow-orange-500/20">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-6 w-40 h-40 rounded-full bg-white/5" />

          <div className="relative flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.18em] mb-1">
                Up Next
              </p>
              <h2 className="text-lg font-bold text-white mb-1 leading-snug">
                {nextStep.heading}
              </h2>
              <p className="text-sm text-white/80 leading-snug max-w-xl">
                {nextStep.description}
              </p>
            </div>
            <div className="mt-3 md:mt-0 shrink-0">
              <Link
                href={nextStep.href}
                className="inline-flex items-center bg-white text-[#FF6B35] text-sm font-semibold
                           px-5 py-2.5 rounded-xl shadow-sm hover:bg-orange-50 transition-colors"
              >
                {nextStep.cta}
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 4. Section header ─────────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase">Your Onboarding</p>
          <h2 className="text-2xl font-bold text-[#0F172A] mt-1">Jump to any area</h2>
          <p className="text-sm text-slate-500 mt-1">Track your progress across every step</p>
        </div>

        {/* ── 5. 7-tile grid + ghost 8th ────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

          {tiles.map((tile) => (
            <Tile key={tile.title} {...tile} />
          ))}

          {/* Ghost 8th tile */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-[#FAF8F3]/50
                          p-5 flex flex-col items-start gap-2 cursor-default opacity-60">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Sparkles size={16} className="text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-300 mt-1">More coming</p>
            <p className="text-[11px] text-slate-400 italic">Additional modules on the way</p>
          </div>

        </div>

        {/* ── 6. Career path card ───────────────────────────────────────────── */}
        <div className="mt-12 bg-gradient-to-br from-[#FAF8F3] to-[#F0FAFA] border border-[#B2DFDB]
                        rounded-2xl p-6 shadow-sm flex items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold text-[#0D5C63] uppercase tracking-widest mb-1">
              My Coaching
            </p>
            <h3 className="text-xl font-bold text-[#0F172A] mt-1">Your career path is waiting.</h3>
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
            <ArrowRight size={18} />
          </Link>
        </div>

      </main>
    </div>
  );
}
