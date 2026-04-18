"use client";

// src/app/dashboard/licensing/page.tsx — Licensing steps

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, patchRoadmapItem, Realtor } from "@/lib/api";

// ── Data ───────────────────────────────────────────────────────────────────────

interface LicensingStep {
  key:         string;
  title:       string;
  description: string;
  link?:       { label: string; href: string };
  note?:       string;
}

const NEW_STEPS: LicensingStep[] = [
  {
    key:         "licensing_new_1",
    title:       "NBREA — Membership Application",
    description: "Complete the membership application on the NBREA portal. Our broker receives a notification immediately when it's submitted. Once we approve on our end, you'll receive an option to pay. Once paid, download your member certificate — you'll need it for Step 2.",
    link:        { label: "members.nbrea.ca", href: "https://members.nbrea.ca/mpower/membership/membership-form.action" },
  },
  {
    key:         "licensing_new_2",
    title:       "FCNB — Licence Application",
    description: "Log into the FCNB portal and start a new application. Attach your NBREA member certificate from Step 1 and your criminal record check. Once submitted, email martin.gallant@therealbrokerage.com — we don't receive automatic notifications.",
    link:        { label: "portal.fcnb.ca", href: "https://portal.fcnb.ca/logon/" },
  },
  {
    key:         "licensing_new_3",
    title:       "NBRE Board — Final Transfer",
    description: "Once you've received confirmation from FCNB that your application is complete, send an email to martin.gallant@therealbrokerage.com and we will complete this step on our end. Typically takes 48 hours. Once done, you're official under Creativ Realty.",
    note:        "Paying an extra $75 at the FCNB step expedites processing to ~48 hours instead of 10 business days. Usually worth it.",
  },
];

const TRANSFER_STEPS: LicensingStep[] = [
  {
    key:         "licensing_xfer_1",
    title:       "NBREA — Membership Transfer",
    description: "Log into NBREA and perform a membership transfer (not a new application). Our broker receives a notification immediately once submitted. Once we approve on our end, you'll receive an option to pay. Once paid, download your member certificate.",
    link:        { label: "members.nbrea.ca", href: "https://members.nbrea.ca/mpower/membership/transfer-form.action" },
  },
  {
    key:         "licensing_xfer_2",
    title:       "FCNB — New Licence Application",
    description: "Attach the member certificate from Step 1. No new criminal check needed. Once submitted, email martin.gallant@therealbrokerage.com. Pay the $75 rush fee if you want to minimize downtime.",
    link:        { label: "portal.fcnb.ca", href: "https://portal.fcnb.ca/logon/" },
  },
  {
    key:         "licensing_xfer_3",
    title:       "Previous Brokerage Cancels Your Membership",
    description: "At this point you'll be unlicensed for up to 48 hours (with the rush fee). Plan accordingly — avoid active transactions mid-switch if possible.",
  },
  {
    key:         "licensing_xfer_4",
    title:       "NBRE Board — Final Transfer",
    description: "Once you've received confirmation from FCNB that your application is complete, send an email to martin.gallant@therealbrokerage.com and we will complete this step on our end. Usually under 24 hours. You're now active under Creativ Realty.",
  },
];

const BLUE = "#3B82F6";

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="shadow-soft-lg rounded-xl p-6 mb-6"
      style={{ backgroundColor: "#3B82F61A", border: "1px solid #3B82F622" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#334155]">{done} of {total} steps completed</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: BLUE }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: BLUE }}
        />
      </div>
    </div>
  );
}

function StepCard({
  step, index, checked, onToggle,
}: {
  step:     LicensingStep;
  index:    number;
  checked:  boolean;
  onToggle: (key: string, val: boolean) => void;
}) {
  return (
    <div
      className="shadow-soft rounded-xl p-5 flex gap-4 transition-shadow hover:shadow-soft-hover"
      style={
        checked
          ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
          : { backgroundColor: "#3B82F61A", border: "1px solid #3B82F622" }
      }
    >
      {/* Step number / check bubble */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold mt-0.5"
        style={
          checked
            ? { backgroundColor: "#10B981", color: "#fff" }
            : { backgroundColor: "#3B82F61A", color: BLUE }
        }
      >
        {checked
          ? <Check size={16} />
          : index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-sm font-semibold ${checked ? "line-through text-[#64748B]" : "text-[#0F172A]"}`}>
            {step.title}
          </h3>
          <button
            onClick={() => onToggle(step.key, !checked)}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border
                        transition-colors whitespace-nowrap
                        ${checked
                          ? "border-teal-200 text-teal-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                          : "border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white"}`}
          >
            {checked ? "✓ Done" : "Mark as done"}
          </button>
        </div>

        <p className="text-sm text-[#334155] mt-1.5 leading-relaxed">{step.description}</p>

        {step.link && (
          <a
            href={step.link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline"
            style={{ color: BLUE }}
          >
            → {step.link.label}
          </a>
        )}

        {step.note && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-semibold">Note: </span>{step.note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

type Tab = "new" | "transfer";

export default function LicensingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,   setRealtor]   = useState<Realtor | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [tab,       setTab]       = useState<Tab>("new");
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
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const steps     = tab === "new" ? NEW_STEPS : TRANSFER_STEPS;
  const doneCount = steps.filter((s) => completed.has(s.key)).length;

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <Sidebar role="realtor" />

      <main className="flex-1 px-8 pt-8 pb-12 overflow-auto">

        {/* ── Page header — no card treatment ──────────────────────────────── */}
        <div className="pb-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Initial Setup
          </p>
          <h1 className="text-xl font-semibold text-[#0F172A]">Licensing</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Complete each step to get your licence under Creativ Realty.
          </p>
        </div>

        {/* ── Tab selector ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-6">
          {(["new", "transfer"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl text-sm font-medium border transition-colors
                ${tab === t
                  ? "bg-[#0D5C63] border-[#0D5C63] text-white"
                  : "bg-white border-[#B2DFDB] text-[#0D5C63] hover:border-[#0D5C63]"}`}
            >
              {t === "new" ? "New Licence" : "Transferring from Another Brokerage"}
            </button>
          ))}
        </div>

        {/* ── Progress card ─────────────────────────────────────────────────── */}
        <ProgressCard done={doneCount} total={steps.length} />

        {/* ── Step cards ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <StepCard
              key={step.key}
              step={step}
              index={i}
              checked={completed.has(step.key)}
              onToggle={toggle}
            />
          ))}
        </div>

      </main>
    </div>
  );
}
