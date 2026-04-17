"use client";

// src/app/dashboard/real-links/page.tsx — REAL Links directory

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Megaphone, GraduationCap, Sparkles,
  Globe, LogIn, Settings,
  ArrowUpRight, ExternalLink, Check,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, updateRealtor, Realtor } from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const KEY_BOOKMARKED = "real_links_bookmarked";
const KEY_COMPLETED  = "real_links_completed";

// ── Helpers ────────────────────────────────────────────────────────────────────

function addKey(arr: string[], key: string): string[] {
  return arr.includes(key) ? arr : [...arr, key];
}
function removeKey(arr: string[], key: string): string[] {
  return arr.filter((k) => k !== key);
}

// ── Hero card ──────────────────────────────────────────────────────────────────

interface HeroCardProps {
  icon:  React.ReactNode;
  title: string;
  desc:  string;
  href:  string;
}

function HeroCard({ icon, title, desc, href }: HeroCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border border-[#B2DFDB] rounded-lg p-5 shadow-sm
                 hover:shadow-md hover:border-l-4 hover:border-l-[#0D5C63] transition-all flex flex-col"
    >
      <div className="bg-[#F0FAFA] rounded-lg p-2.5 self-start">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mt-3">{title}</h3>
      <p className="text-sm text-slate-600 mt-1 flex-1 leading-relaxed">{desc}</p>
      <div className="flex items-center gap-1 mt-4 text-[#0D5C63] font-medium text-sm group-hover:underline">
        Open <ArrowUpRight size={16} />
      </div>
    </a>
  );
}

// ── Directory section card ─────────────────────────────────────────────────────

interface DirectoryLink {
  label: string;
  href:  string;
}

interface SectionCardProps {
  icon:  React.ReactNode;
  title: string;
  links: DirectoryLink[];
}

function SectionCard({ icon, title, links }: SectionCardProps) {
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
        <div className="bg-[#F0FAFA] rounded-lg p-2 shrink-0">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="space-y-0.5 mt-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group py-1.5"
          >
            <span className="text-sm text-slate-700 group-hover:text-[#0D5C63] font-medium transition-colors">
              {link.label}
            </span>
            <ExternalLink
              size={14}
              className="text-slate-300 group-hover:text-[#0D5C63] shrink-0 ml-2 transition-colors"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────

const heroCards: HeroCardProps[] = [
  {
    icon:  <LayoutDashboard size={20} className="text-[#0D5C63]" />,
    title: "reZEN",
    desc:  "Your daily platform. Transactions, profile, schedule, team management, earnings. This is where you work.",
    href:  "https://app.onereal.com/",
  },
  {
    icon:  <Megaphone size={20} className="text-[#0D5C63]" />,
    title: "Marketing Center",
    desc:  "Templates, branding assets, and compliant marketing materials. Design anything Real-branded from here.",
    href:  "https://marketing.onereal.com/",
  },
  {
    icon:  <GraduationCap size={20} className="text-[#0D5C63]" />,
    title: "Real Academy",
    desc:  "Live learning, recorded courses, and community masterminds. Your career education hub for every stage.",
    href:  "https://www.real.academy/",
  },
  {
    icon:  <Sparkles size={20} className="text-[#0D5C63]" />,
    title: "Leo",
    desc:  "AI-powered help across the Real platform. Ask questions, get instant answers, use Leo with your clients.",
    href:  "https://support.therealbrokerage.com/hc/en-us/sections/16616323963671-Leo",
  },
];

const directorySections: SectionCardProps[] = [
  {
    icon:  <Globe size={18} className="text-[#0D5C63]" />,
    title: "Main REAL Websites",
    links: [
      { label: "One Real / Main Website", href: "https://onereal.com/" },
      { label: "One Real Canada",         href: "https://onereal.ca/" },
      { label: "Join Real",               href: "https://joinreal.com/" },
    ],
  },
  {
    icon:  <LogIn size={18} className="text-[#0D5C63]" />,
    title: "Agent Login & Core Platform",
    links: [
      { label: "reZEN / Agent Login", href: "https://app.onereal.com/" },
      { label: "REAL Help Center",    href: "https://support.therealbrokerage.com/hc/en-us" },
    ],
  },
  {
    icon:  <Megaphone size={18} className="text-[#0D5C63]" />,
    title: "Marketing",
    links: [
      { label: "Marketing Center",                   href: "https://marketing.onereal.com/" },
      { label: "Marketing Help / Overview",           href: "https://support.therealbrokerage.com/hc/en-us/sections/16997140444439-Marketing-Overview" },
      { label: "Marketing Templates + Assets",        href: "https://support.therealbrokerage.com/hc/en-us/sections/5978409520023-Marketing-Templates-Assets" },
      { label: "Logos + Brand Elements",              href: "https://support.therealbrokerage.com/hc/en-us/sections/16486851059095-Logos-Brand-Elements" },
      { label: "Business Cards + Signage",            href: "https://support.therealbrokerage.com/hc/en-us/sections/16524577402263-Business-Cards-Signage" },
      { label: "Social Media Templates + Shareables", href: "https://support.therealbrokerage.com/hc/en-us/sections/19611037282839-Social-Media-Templates-and-Shareables" },
      { label: "Real Design Center Help",             href: "https://support.therealbrokerage.com/hc/en-us/sections/16524594634647-Real-Design-Center" },
    ],
  },
  {
    icon:  <GraduationCap size={18} className="text-[#0D5C63]" />,
    title: "Academy & Training",
    links: [
      { label: "Real Academy",                 href: "https://www.real.academy/" },
      { label: "One Real Community / Live Learning", href: "https://www.real.academy/community" },
      { label: "New Courses",                  href: "https://www.real.academy/new-courses" },
      { label: "Real Academy Vault",           href: "https://www.real.academy/real-academy-vault-library" },
      { label: "Learning Categories",          href: "https://www.real.academy/learning-categories" },
      { label: "Real Academy Help",            href: "https://support.therealbrokerage.com/hc/en-us/sections/14047573466007-Real-Academy" },
    ],
  },
  {
    icon:  <Settings size={18} className="text-[#0D5C63]" />,
    title: "Tech",
    links: [
      { label: "What is reZEN?",                  href: "https://support.therealbrokerage.com/hc/en-us/articles/18138195152279-What-is-reZEN" },
      { label: "Get Started at Real",             href: "https://support.therealbrokerage.com/hc/en-us/articles/13325078402199-Get-Started-at-Real-Overview" },
      { label: "How to Set Up Your reZEN Profile", href: "https://support.therealbrokerage.com/hc/en-us/articles/18200877994903-How-to-setup-your-reZEN-Profile" },
      { label: "How to Navigate reZEN",           href: "https://support.therealbrokerage.com/hc/en-us/articles/18244725446295-How-to-Navigate-reZEN" },
      { label: "How to Access reZEN API",         href: "https://support.therealbrokerage.com/hc/en-us/articles/19256926523031-How-to-access-reZEN-API" },
    ],
  },
  {
    icon:  <Sparkles size={18} className="text-[#0D5C63]" />,
    title: "Leo & AI",
    links: [
      { label: "What is Leo?",                      href: "https://support.therealbrokerage.com/hc/en-us/articles/16616302974743-What-is-Leo" },
      { label: "How to Use Leo",                    href: "https://support.therealbrokerage.com/hc/en-us/articles/16616500586391-How-do-I-use-Leo" },
      { label: "Leo Help Section",                  href: "https://support.therealbrokerage.com/hc/en-us/sections/16616323963671-Leo" },
      { label: "HeyLeo",                            href: "https://heyleo.com/" },
      { label: "What is HeyLeo?",                   href: "https://support.therealbrokerage.com/hc/en-us/articles/39346910271255-What-is-HeyLeo" },
      { label: "How to Set Up HeyLeo for Clients",  href: "https://support.therealbrokerage.com/hc/en-us/articles/38967913803287-How-can-I-set-up-HeyLeo-to-begin-using-it-with-my-clients" },
    ],
  },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RealLinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,   setRealtor]   = useState<Realtor | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email)
      .then((r) => {
        if (!r) { router.push("/"); return; }
        setRealtor(r);
        setCompleted(r.roadmap_completed ?? []);
      })
      .finally(() => setLoading(false));
  }, [status, session, router]);

  // ── Save helper ──────────────────────────────────────────────────────────────

  async function saveCompleted(next: string[]) {
    if (!realtor) return;
    setSaving(true);
    setCompleted(next); // optimistic
    try {
      const updated = await updateRealtor(realtor.id, { roadmap_completed: next });
      setRealtor(updated);
      setCompleted(updated.roadmap_completed ?? next);
    } catch (e) {
      console.error("Failed to save", e);
      setCompleted(realtor.roadmap_completed ?? []);
    } finally {
      setSaving(false);
    }
  }

  function toggleBookmarked() {
    const isOn = completed.includes(KEY_BOOKMARKED);
    saveCompleted(isOn ? removeKey(completed, KEY_BOOKMARKED) : addKey(completed, KEY_BOOKMARKED));
  }

  function markComplete() {
    saveCompleted(addKey(completed, KEY_COMPLETED));
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isBookmarked = completed.includes(KEY_BOOKMARKED);
  const isCompleted  = completed.includes(KEY_COMPLETED);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#F0FAFA] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Initial Setup</p>
          <h1 className="text-3xl font-bold text-[#0D5C63] mt-2">REAL Links</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            Every important Real Brokerage link in one place. Bookmark this page — you&apos;ll come back to it often.
          </p>
        </div>

        {/* ── Start Here — 4 hero cards ─────────────────────────────────────── */}
        <div className="mt-10">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">Start Here</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">The four you&apos;ll use most</h2>
          <p className="text-sm text-slate-600 mt-1">
            Bookmark these four first. They cover 90% of your day-to-day work at Real.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {heroCards.map((card) => (
              <HeroCard key={card.href} {...card} />
            ))}
          </div>
        </div>

        {/* ── Full Directory ────────────────────────────────────────────────── */}
        <div className="mt-12">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">The Full Directory</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">Every link, organized</h2>
          <p className="text-sm text-slate-600 mt-1">
            Grouped by area. Click any link to open in a new tab.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {directorySections.map((section) => (
              <SectionCard key={section.title} {...section} />
            ))}
          </div>
        </div>

        {/* ── Completion Card ───────────────────────────────────────────────── */}
        <div
          className={`mt-12 mb-12 bg-white rounded-lg p-6 shadow-sm border border-l-4 transition-colors
                      ${isCompleted
                        ? "border-[#B2DFDB] border-l-[#0D5C63]"
                        : "border-[#B2DFDB] border-l-[#FF6B35]"}`}
        >
          <h2 className="text-xl font-semibold text-slate-800">Save REAL Links to your bookmarks</h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            This page is your home base for every Real Brokerage link you&apos;ll ever need. Add it to your browser bookmarks so it&apos;s always one click away — then come back here whenever you need something.
          </p>
          <p className="text-sm text-slate-500 italic mt-3">
            On Mac: Cmd+D. On Windows: Ctrl+D.
          </p>

          {/* Bookmarked checkbox */}
          <div className="mt-5 mb-5">
            <button
              onClick={toggleBookmarked}
              disabled={saving}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span
                className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                            ${isBookmarked
                              ? "bg-[#0D5C63] border-[#0D5C63]"
                              : "border-slate-300 hover:border-[#0D5C63]"}`}
              >
                {isBookmarked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </span>
              I&apos;ve bookmarked this page
            </button>
            {isBookmarked && (
              <div className="flex items-center gap-1.5 mt-2 text-sm text-emerald-600 font-medium">
                <Check className="w-4 h-4" />
                Bookmarked — you&apos;re all set.
              </div>
            )}
          </div>

          {/* Complete button */}
          {isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <Check className="w-5 h-5" />
              REAL Links complete
            </div>
          ) : (
            <>
              <button
                onClick={markComplete}
                disabled={!isBookmarked || saving}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors
                            ${isBookmarked && !saving
                              ? "bg-[#FF6B35] hover:bg-[#E85A24] text-white"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                {saving ? "Saving…" : "Mark REAL Links complete"}
              </button>
              {!isBookmarked && (
                <p className="text-xs text-slate-400 mt-2">
                  Check &ldquo;I&apos;ve bookmarked this page&rdquo; first.
                </p>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
