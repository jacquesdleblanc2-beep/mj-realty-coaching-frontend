"use client";

// src/app/dashboard/systems/page.tsx — Systems Setup

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Data ───────────────────────────────────────────────────────────────────────

type PlatformType = "web" | "mobile" | "both";

interface Platform {
  key:         string;
  name:        string;
  url:         string;
  href:        string;
  description: string;
  type:        PlatformType;
  note?:       string;
}

const PLATFORMS: Platform[] = [
  {
    key:         "syssetup_matrix",
    name:        "Matrix (MLS)",
    url:         "nbrun.mlxmatrix.com",
    href:        "https://nbrun.mlxmatrix.com/Matrix/MyMatrix",
    description: "Your primary tool for MLS listings, market data, and comparables. You'll receive your Matrix login credentials by email from the New Brunswick Real Estate Board after your membership is approved. Your login also works for Touchbase.",
    type:        "both",
  },
  {
    key:         "syssetup_paol",
    name:        "PAOL SNB",
    url:         "paol-efel.snb.ca/paol.html",
    href:        "https://paol-efel.snb.ca/paol.html",
    description: "Property Assessment Online — search any civic address in New Brunswick to view the assessed value, property size, and tax information. Essential for pricing conversations and listing prep.",
    type:        "web",
  },
  {
    key:         "syssetup_real_academy",
    name:        "REAL Academy",
    url:         "real.academy",
    href:        "https://www.real.academy/",
    description: "The Real Brokerage's training platform. Complete your New Agent Starter Series here and access career journey courses for every stage of your career. Log in with your Real Brokerage credentials.",
    type:        "web",
  },
  {
    key:         "syssetup_snb_planet",
    name:        "SNB PLANET",
    url:         "planet.snb.ca",
    href:        "https://planet.snb.ca",
    description: "New Brunswick's land registry portal. Search title ownership, registered documents, and property assessment records. Realtors use this to verify ownership and pull title information before listing or writing offers. Subscription is $65/month.",
    type:        "web",
    note:        "Can be set up later",
  },
  {
    key:         "syssetup_supra_ekey",
    name:        "Supra eKey",
    url:         "supraekey.com",
    href:        "https://www.supraekey.com",
    description: "The app that opens electronic lockboxes during showings. After your NBREA membership is approved, you'll receive a welcome email from the New Brunswick Real Estate Board with your authorization code and default PIN. Download the Supra EKey app, select 'I already have an authorization code,' and enter the code from that email to activate.",
    type:        "mobile",
  },
  {
    key:         "syssetup_touchbase",
    name:        "Touchbase",
    url:         "touchbasesm2.ca",
    href:        "https://touchbasesm2.ca/mobile/Install/BoardSelection",
    description: "Showing appointment software used by most realtors in the area to schedule and confirm showings. When you receive a showing request through Matrix, Touchbase manages the confirmation with the listing agent. Login uses the same credentials as Matrix. You'll need to select your Real Estate Board on first launch.",
    type:        "both",
  },
];

const TOTAL = PLATFORMS.length; // 6 active platforms (Rezen and Canva excluded from count)

// ── Platform type badge ────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PlatformType }) {
  const pill = (icon: React.ReactNode, label: string) => (
    <span className="flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
      {icon}
      {label}
    </span>
  );

  if (type === "web")    return pill(<Monitor size={12} />, "Web");
  if (type === "mobile") return pill(<Smartphone size={12} />, "Mobile");
  return (
    <span className="flex items-center gap-1">
      {pill(<Monitor size={12} />, "Web")}
      {pill(<Smartphone size={12} />, "Mobile")}
    </span>
  );
}

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
        <div>

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Systems Setup</h1>
            <p className="text-sm text-[#0A4A50] mt-1">Get connected to every tool you&apos;ll use as a Creativ Realty agent.</p>
          </div>

          <ProgressBar done={doneCount} total={TOTAL} />

          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* ── Active platform cards ─────────────────────────────────────── */}
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
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <TypeBadge type={p.type} />
                      {done && (
                        <span className="w-5 h-5 rounded-full bg-[#0D5C63] flex items-center justify-center shrink-0">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                  {p.note && (
                    <p className="text-xs text-slate-500 italic">{p.note}</p>
                  )}
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

            {/* ── Rezen — Coming Soon ───────────────────────────────────────── */}
            <div className="bg-[#F0FAFA]/50 border-2 border-dashed border-[#B2DFDB] rounded-xl p-4 flex flex-col gap-2 cursor-default">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-[#0D5C63]">Rezen</span>
                <span className="bg-[#0D5C63] text-white text-xs px-3 py-1 rounded-full font-semibold shrink-0">
                  Coming Soon
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The Real Brokerage&apos;s all-in-one transaction platform. Replaces Transaction Desk when Creativ Realty joins Real.
              </p>
            </div>

          </div>

          {/* ── Recommended Tools ─────────────────────────────────────────────── */}
          <div className="mt-10 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Tools</p>
            <h2 className="text-xl font-semibold text-slate-800 mt-1">Optional but highly recommended</h2>
            <p className="text-sm text-slate-600 mt-0.5">Tools that make everything else easier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* ── Canva Pro ─────────────────────────────────────────────────── */}
            <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 flex flex-col gap-2 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-[#0D5C63]">Canva Pro</span>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <TypeBadge type="both" />
                  <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full shrink-0">
                    Optional
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Design listing flyers, social posts, business card mockups, open house invites, and client gifts — all without hiring a designer. Canva Pro unlocks premium templates, brand kit storage, and background remover.
              </p>
              <a
                href="https://www.canva.com/pro/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto text-xs font-medium px-3 py-1.5 rounded-lg border border-[#0D5C63] text-[#0D5C63]
                           hover:bg-[#0D5C63] hover:text-white transition-colors self-start"
              >
                Start your free trial
              </a>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
