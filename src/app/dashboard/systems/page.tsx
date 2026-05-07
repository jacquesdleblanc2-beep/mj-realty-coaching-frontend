"use client";

// src/app/dashboard/systems/page.tsx — Systems Setup

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Monitor, Smartphone, Check, X } from "lucide-react";
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

const VIOLET = "#8B5CF6";

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

// ── Progress card ──────────────────────────────────────────────────────────────

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="shadow-soft-lg rounded-xl p-6 mb-6"
      style={{ backgroundColor: "#8B5CF61A", border: "1px solid #8B5CF622" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#334155]">{done} of {total} platforms set up</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: VIOLET }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: VIOLET }}
        />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,    setRealtor]    = useState<Realtor | null>(null);
  const [completed,  setCompleted]  = useState<Set<string>>(new Set());
  const [loading,    setLoading]    = useState(true);
  const [snbHelpOpen, setSnbHelpOpen] = useState(false);

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
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const doneCount = PLATFORMS.filter((p) => completed.has(p.key)).length;

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <Sidebar role="realtor" />

      <main className="flex-1 px-8 pt-8 pb-12 overflow-auto">

        {/* ── Page header — no card treatment ──────────────────────────────── */}
        <div className="pb-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Initial Setup
          </p>
          <h1 className="text-xl font-semibold text-[#0F172A]">Systems Setup</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Get connected to every tool you&apos;ll use as a Creativ Realty agent.
          </p>
        </div>

        {/* ── Progress card ─────────────────────────────────────────────────── */}
        <ProgressCard done={doneCount} total={TOTAL} />

        {/* ── Platforms section label ───────────────────────────────────────── */}
        <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase mb-4">
          Platforms
        </p>

        {/* ── Platform cards grid ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {PLATFORMS.map((p) => {
            const done = completed.has(p.key);
            return (
              <div
                key={p.key}
                className="shadow-soft rounded-xl p-5 flex flex-col gap-3 transition-shadow hover:shadow-soft-hover"
                style={
                  done
                    ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
                    : { backgroundColor: "#8B5CF61A", border: "1px solid #8B5CF622" }
                }
              >
                {/* Name row */}
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-[#0F172A]">{p.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <TypeBadge type={p.type} />
                    {done && (
                      <span className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#334155] leading-relaxed">{p.description}</p>

                {/* Optional note */}
                {p.note && (
                  <p className="text-xs text-[#64748B] italic">{p.note}</p>
                )}

                {/* Link */}
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline"
                  style={{ color: VIOLET }}
                >
                  → {p.url}
                </a>

                {/* Action buttons */}
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggle(p.key, !done)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                                ${done
                                  ? "border-teal-200 text-teal-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                                  : "border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white"}`}
                  >
                    {done ? "✓ Set up" : "Mark as set up"}
                  </button>

                  {p.key === "syssetup_snb_planet" && (
                    <button
                      onClick={() => setSnbHelpOpen(true)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#FF6B35] text-[#FF6B35]
                                 hover:bg-[#FF6B35] hover:text-white transition-colors"
                    >
                      How to sign up
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* ── Rezen — Coming Soon ───────────────────────────────────────────── */}
          <div
            className="shadow-none rounded-xl p-5 flex flex-col gap-3 cursor-default"
            style={{ backgroundColor: "#F0FAFA", border: "1px dashed #B2DFDB" }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-[#0F172A]">Rezen</span>
              <span className="bg-[#0D5C63]/10 text-[#0D5C63] text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                Coming Soon
              </span>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
              The Real Brokerage&apos;s all-in-one transaction platform. Replaces Transaction Desk when Creativ Realty joins Real.
            </p>
          </div>

        </div>

        {/* ── Recommended Tools ─────────────────────────────────────────────── */}
        <div className="mt-10 mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Recommended Tools</p>
          <h2 className="text-xl font-semibold text-[#0F172A] mt-1">Optional but highly recommended</h2>
          <p className="text-sm text-slate-500 mt-0.5">Tools that make everything else easier.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ── Canva Pro ─────────────────────────────────────────────────────── */}
          <div
            className="shadow-soft rounded-xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: "#FAFAF7", border: "1px solid #E7E5DE" }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold text-sm text-[#0F172A]">Canva Pro</span>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                <TypeBadge type="both" />
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full shrink-0">
                  Optional
                </span>
              </div>
            </div>
            <p className="text-xs text-[#334155] leading-relaxed">
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

      </main>

      {snbHelpOpen && (
        <SnbPlanetHelpModal onClose={() => setSnbHelpOpen(false)} />
      )}
    </div>
  );
}

// ── SNB PLANET signup-help modal ───────────────────────────────────────────────

function SnbPlanetHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="snb-help-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              SNB PLANET
            </p>
            <h2 id="snb-help-title" className="text-lg font-semibold text-[#0F172A]">
              How to sign up
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto text-sm text-[#334155] space-y-4">
          <p>To create a new account, please complete the following forms:</p>

          <ol className="space-y-2 list-decimal list-outside pl-5">
            <li>
              <span className="font-semibold text-[#0F172A]">Client Registration</span>
              <span className="text-slate-600">
                {" "}— when prompted to choose which program you want, hit the checkmark
                box. You do not have a Client #.
              </span>
            </li>
            <li>
              <span className="font-semibold text-[#0F172A]">Financial Officer Registration</span>
              <span className="text-slate-600">
                {" "}— include a void cheque or a pre-authorized debit from your financial
                institution.
              </span>
            </li>
            <li>
              <span className="font-semibold text-[#0F172A]">Client Administrator Registration</span>
            </li>
            <li>
              <span className="font-semibold text-[#0F172A]">Individual User Registration</span>
              <span className="text-slate-600">
                {" "}— when prompted to choose which program you want, hit the checkmark
                box. You do not have a Client #.
              </span>
            </li>
          </ol>

          <div className="rounded-lg border border-[#FF6B35]/30 bg-[#FFF4ED] p-4">
            <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-widest mb-2">
              Part 4 — Charge Model
            </p>
            <p className="mb-3">
              On Part 4, identify under <span className="font-semibold">Charge Model Option</span>{" "}
              what type of subscription you require:
            </p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="font-semibold text-[#0F172A] shrink-0">a.</span>
                <span>
                  <span className="font-semibold text-[#0F172A]">Transactional</span> — $10/month
                  minimum fee, plus $1 for every click of the mouse while searching in
                  &ldquo;Real Property Information&rdquo; only.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-[#0F172A] shrink-0">b.</span>
                <span>
                  <span className="font-semibold text-[#0F172A]">Browser (Subscription)</span> —
                  $65/month. Provides unlimited searching in &ldquo;Real Property Information&rdquo;
                  only.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-[#0F172A] mb-1">Note</p>
            <p>
              Regardless of the subscription you choose, there are additional fees for reports
              and half-day historical searches that are above and beyond the monthly fees
              (Real Property Information &ndash; Services and Fees).
            </p>
          </div>

          <div className="rounded-lg border border-[#0D5C63]/20 bg-[#F0FAFA] p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
              Submit forms to
            </p>
            <p>
              Send completed forms and void cheque to Finance at{" "}
              <a
                href="mailto:SNBHQFinServAR@SNB.CA"
                className="font-semibold text-[#0D5C63] hover:underline"
              >
                SNBHQFinServAR@SNB.CA
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-[#0D5C63] text-white
                       hover:bg-[#0A4A50] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
