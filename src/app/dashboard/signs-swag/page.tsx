"use client";

// src/app/dashboard/signs-swag/page.tsx — Signs & Swag

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Download,
  CreditCard, Home, MapPin, IdCard, Sparkles,
  ShieldCheck, Check, ExternalLink,
} from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, updateRealtor, Realtor } from "@/lib/api";

// ── Constants ──────────────────────────────────────────────────────────────────

const KEY_BIZ_CARDS    = "swag_business_cards";
const KEY_LISTING      = "swag_listing_signs";
const KEY_OPEN_HOUSE   = "swag_open_house_signs";
const KEY_NAME_BADGE   = "swag_name_badge";
const KEY_DIGITAL      = "swag_digital_templates";
const KEY_GUIDELINES   = "swag_brand_guidelines_reviewed";
const KEY_COMPLETED    = "swag_completed";

const MATERIAL_KEYS = [
  KEY_BIZ_CARDS,
  KEY_LISTING,
  KEY_OPEN_HOUSE,
  KEY_NAME_BADGE,
  KEY_DIGITAL,
] as const;

const BRAND_GUIDELINES_URL =
  "https://onereal.widencollective.com/assets/share/asset/yzrcmpqknn";
const BRAND_PORTAL_URL =
  "https://onereal.widencollective.com/portals/tcbndxev/BrandElements";

const ORANGE = "#F97316";

// ── Helpers ────────────────────────────────────────────────────────────────────

function addKey(arr: string[], key: string): string[] {
  return arr.includes(key) ? arr : [...arr, key];
}
function removeKey(arr: string[], key: string): string[] {
  return arr.filter((k) => k !== key);
}
function toggleKey(arr: string[], key: string, on: boolean): string[] {
  return on ? addKey(arr, key) : removeKey(arr, key);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressCard({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div
      className="shadow-soft-lg rounded-xl p-6 mb-8"
      style={{ backgroundColor: "#F973161A", border: "1px solid #F9731622" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#334155]">{done} of {total} steps complete</span>
        <span className="text-sm font-bold tabular-nums" style={{ color: ORANGE }}>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: ORANGE }}
        />
      </div>
    </div>
  );
}

interface VendorLink {
  label: string;
  href?: string;
  note?: string;
}

interface MaterialCardProps {
  icon:      React.ReactNode;
  title:     string;
  priority:  "ESSENTIAL" | "RECOMMENDED" | "OPTIONAL";
  desc:      string;
  vendors:   VendorLink[];
  itemKey:   string;
  checked:   boolean;
  onToggle:  (key: string, on: boolean) => void;
  saving:    boolean;
}

function MaterialCard({
  icon, title, priority, desc, vendors, itemKey, checked, onToggle, saving,
}: MaterialCardProps) {
  const iconColor = checked ? "#10B981" : ORANGE;
  const iconBg    = checked ? "#10B9811A" : "#F973161A";

  return (
    <div
      className="flex flex-col rounded-xl p-5 shadow-soft transition-shadow hover:shadow-soft-hover"
      style={
        checked
          ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
          : { backgroundColor: "#F973161A", border: "1px solid #F9731622" }
      }
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="rounded-lg p-2.5 shrink-0" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 tracking-wide
                      ${priority === "ESSENTIAL"
                        ? "bg-[#FF6B35] text-white"
                        : priority === "RECOMMENDED"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-slate-50 text-slate-400"}`}
        >
          {priority}
        </span>
      </div>

      <h3 className="text-base font-semibold text-[#0F172A] mb-2">{title}</h3>
      <p className="text-sm text-[#334155] leading-relaxed flex-1">{desc}</p>

      {/* Vendors */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
          Where to order
        </p>
        <ul className="space-y-1.5">
          {vendors.map((v, i) =>
            v.href ? (
              <li key={i}>
                <a
                  href={v.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: ORANGE }}
                >
                  {v.label}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
                {v.note && (
                  <span className="text-xs text-[#64748B] ml-1">— {v.note}</span>
                )}
              </li>
            ) : (
              <li key={i} className="text-sm text-[#64748B]">
                {v.label}
                {v.note && (
                  <span className="text-[#94A3B8] ml-1">— {v.note}</span>
                )}
              </li>
            )
          )}
        </ul>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => onToggle(itemKey, !checked)}
        disabled={saving}
        className={`mt-5 flex items-center gap-2 text-sm font-medium self-start px-4 py-2 rounded-lg
                    border transition-colors
                    ${checked
                      ? "bg-[#0D5C63] border-[#0D5C63] text-white"
                      : "border-[#0D5C63] text-[#0D5C63] hover:bg-[#0D5C63] hover:text-white"}`}
      >
        {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
        {checked ? "Ordered" : "Mark as ordered"}
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SignsSwagPage() {
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
    setCompleted(next);
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

  function handleToggle(key: string, on: boolean) {
    saveCompleted(toggleKey(completed, key, on));
  }

  function handleGuidelinesToggle() {
    handleToggle(KEY_GUIDELINES, !completed.includes(KEY_GUIDELINES));
  }

  async function markComplete() {
    saveCompleted(addKey(completed, KEY_COMPLETED));
  }

  // ── Derived ──────────────────────────────────────────────────────────────────

  const isCompleted    = completed.includes(KEY_COMPLETED);
  const guidelinesOk   = completed.includes(KEY_GUIDELINES);
  const bizCardsOk     = completed.includes(KEY_BIZ_CARDS);
  const completedCount = [...MATERIAL_KEYS, KEY_GUIDELINES].filter((k) => completed.includes(k)).length;
  const otherOrdered   = MATERIAL_KEYS.filter((k) => k !== KEY_BIZ_CARDS && completed.includes(k)).length;
  const canComplete    = bizCardsOk && otherOrdered >= 1 && guidelinesOk && !isCompleted;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#FAF8F3] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  // ── Material card data ────────────────────────────────────────────────────────

  const materials: Omit<MaterialCardProps, "checked" | "onToggle" | "saving">[] = [
    {
      icon:     <CreditCard className="w-5 h-5" />,
      title:    "Business Cards",
      priority: "ESSENTIAL",
      desc:     "Your single most important print piece. Hand these out at every showing, every open house, every coffee. Use a Real-approved design from the Brand Portal.",
      vendors:  [
        { label: "Vistaprint Canada", href: "https://www.vistaprint.ca/business-cards",                          note: "budget-friendly, fast turnaround" },
        { label: "MOO Canada",        href: "https://www.moo.com/ca/business-cards/for/real-estate.html", note: "premium paper and finishes" },
      ],
      itemKey:  KEY_BIZ_CARDS,
    },
    {
      icon:     <Home className="w-5 h-5" />,
      title:    "Listing Signs",
      priority: "ESSENTIAL",
      desc:     "The 24\" × 32\" sign that goes in every seller's front yard. Most new realtors order 6–12 to start. You'll also need stakes or frames — usually easier to get from a local sign shop.",
      vendors:  [
        { label: "Local sign shops",   note: "recommended for stakes and installation" },
        { label: "Vistaprint Canada",  href: "https://www.vistaprint.com/signs-posters/real-estate-signage", note: "national option, ship-to-door" },
      ],
      itemKey:  KEY_LISTING,
    },
    {
      icon:     <MapPin className="w-5 h-5" />,
      title:    "Open House Signs",
      priority: "ESSENTIAL",
      desc:     "Directional signs for busy corners ('OPEN HOUSE →') and a main sign for the property. You'll need 4–6 directional signs to catch traffic from multiple routes.",
      vendors:  [
        { label: "Local sign shops",  note: "same shop as your listing signs" },
        { label: "Vistaprint Canada", href: "https://www.vistaprint.com/signs-posters/real-estate-signage" },
      ],
      itemKey:  KEY_OPEN_HOUSE,
    },
    {
      icon:     <IdCard className="w-5 h-5" />,
      title:    "Name Badge",
      priority: "OPTIONAL",
      desc:     "For open houses, networking events, and office meet-and-greets. Magnetic backs are worth the small upgrade — your blazer will thank you.",
      vendors:  [
        { label: "Vistaprint Canada",           href: "https://www.vistaprint.ca/promotional-products/name-badges" },
        { label: "Local print/engraving shops", note: "often faster for single badges" },
      ],
      itemKey:  KEY_NAME_BADGE,
    },
    {
      icon:     <Sparkles className="w-5 h-5" />,
      title:    "Digital Marketing Templates",
      priority: "RECOMMENDED",
      desc:     "Social posts, feature sheets, email signatures, just-listed graphics. Pull these from the Brand Portal and customize in Canva. One checkbox covers 'I've grabbed what I need.'",
      vendors:  [
        { label: "Real Brand Portal", href: BRAND_PORTAL_URL,               note: "download and customize in Canva" },
        { label: "Canva Pro",         href: "https://www.canva.com/pro/",   note: "if you haven't yet — see Systems Setup" },
      ],
      itemKey:  KEY_DIGITAL,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F3]">
      <Sidebar role="realtor" />

      <main className="flex-1 px-8 pt-8 pb-12 overflow-auto">

        {/* ── Page header — no card treatment ──────────────────────────────── */}
        <div className="pb-4 mb-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Initial Setup
          </p>
          <h1 className="text-xl font-semibold text-[#0F172A]">Signs &amp; Swag</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Your brand in the real world. Listing signs, business cards, open house materials — designed the Real way, printed by vendors you choose.
          </p>
        </div>

        {/* ── Express Imaging announcement ──────────────────────────────────── */}
        <div
          className="shadow-soft-lg rounded-xl p-6 mb-6"
          style={{ backgroundColor: "#F0FAFA", border: "2px solid #0D5C63" }}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="text-xl font-semibold text-[#0D5C63] mb-1">
                Signs &amp; Swag Are Now Available
              </h3>
              <p className="text-sm text-gray-600">
                Through our partnered platform for Real Brokerage agents
              </p>
            </div>
          </div>

          <p className="text-gray-800 mb-3">
            Everything is in place for you to order your own signs and swag. Our partner,{" "}
            <span className="font-semibold">Express Imaging</span>, has set up a dedicated platform
            with pre-approved templates at discounted prices — making it easier than ever to get started.
            Don&apos;t want to use their templates? There are options for that as well.
          </p>

          <div className="bg-white rounded-lg p-4 mb-4 border border-[#B2DFDB]">
            <p className="font-semibold text-[#0D5C63] mb-2">How to Place Your Order</p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Browse available products (signs, marketing materials, swag, and more)</li>
              <li>Submit and pay for your order through the platform</li>
              <li>Pick up your completed order once it&apos;s ready</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            You can order on your own, but for ease and consistency we recommend ordering through
            Express Imaging directly.
          </p>

          <a
            href="https://expressimaging.wixstudio.com/real-broker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e85a2a] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Order on Express Imaging
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* ── Progress card ─────────────────────────────────────────────────── */}
        <ProgressCard done={completedCount} total={6} />

        {/* ── Brand Hub section label ───────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase">Start Here</p>
          <h2 className="text-xl font-semibold text-[#0F172A] mt-1">Your REAL brand toolkit</h2>
          <p className="text-sm text-slate-500 mt-1">
            Before you order anything, download what you need from Real Brokerage&apos;s brand portals. Every piece of your marketing — from signs to social — uses these assets.
          </p>
        </div>

        {/* ── Brand Hub Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

          {/* Brand Guidelines */}
          <div
            className="shadow-soft rounded-xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-soft-hover"
            style={
              guidelinesOk
                ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
                : { backgroundColor: "#F973161A", border: "1px solid #F9731622" }
            }
          >
            <div className="flex items-start gap-3">
              <div
                className="p-3 rounded-lg shrink-0"
                style={{
                  backgroundColor: guidelinesOk ? "#10B9811A" : "#F973161A",
                  color: guidelinesOk ? "#10B981" : ORANGE,
                }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">Brand Guidelines</h3>
                <p className="text-sm text-[#334155] mt-1">
                  The rules of the road. Logo usage, approved colors, fonts, spacing, and what you can and can&apos;t do with the Real brand on your materials.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <a
                href={BRAND_GUIDELINES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 self-start text-sm font-medium px-4 py-2 rounded-lg
                           border border-[#0D5C63] text-[#0D5C63] hover:bg-[#F0FAFA] transition-colors"
              >
                Open Brand Guidelines
                <ExternalLink size={14} />
              </a>
              <button
                onClick={handleGuidelinesToggle}
                disabled={saving}
                className="flex items-center gap-2 self-start text-sm text-[#334155] hover:text-[#0F172A] transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${guidelinesOk
                                ? "bg-[#10B981] border-[#10B981]"
                                : "border-slate-300 hover:border-[#0D5C63]"}`}
                >
                  {guidelinesOk && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                I&apos;ve reviewed the brand guidelines
              </button>
            </div>
          </div>

          {/* Brand Elements Portal */}
          <div
            className="shadow-soft rounded-xl p-5 flex flex-col gap-4 transition-shadow hover:shadow-soft-hover"
            style={{ backgroundColor: "#F973161A", border: "1px solid #F9731622" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="p-3 rounded-lg shrink-0"
                style={{ backgroundColor: "#F973161A", color: ORANGE }}
              >
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">Brand Elements Portal</h3>
                <p className="text-sm text-[#334155] mt-1">
                  Logos, templates, photography, graphics. Download everything you need — already designed, already on-brand, ready to hand to a printer or drop into Canva.
                </p>
              </div>
            </div>
            <a
              href={BRAND_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-sm font-medium px-4 py-2 rounded-lg
                         border border-[#0D5C63] text-[#0D5C63] hover:bg-[#F0FAFA] transition-colors"
            >
              Open Brand Portal
              <ExternalLink size={14} />
            </a>
          </div>

        </div>

        {/* ── Materials section label ───────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs tracking-widest text-slate-500 font-semibold uppercase">Your Materials</p>
          <h2 className="text-xl font-semibold text-[#0F172A] mt-1">What you&apos;ll need</h2>
          <p className="text-sm text-slate-500 mt-1">
            The essentials for your first 90 days. Check items off as you order them.
          </p>
        </div>

        {/* ── Materials Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {materials.map((m) => (
            <MaterialCard
              key={m.itemKey}
              {...m}
              checked={completed.includes(m.itemKey)}
              onToggle={handleToggle}
              saving={saving}
            />
          ))}
        </div>

        {/* ── DIY Rules Placeholder ─────────────────────────────────────────── */}
        <div
          className="shadow-soft rounded-xl p-5 mb-12"
          style={{ backgroundColor: "#FAFAF7", border: "1px solid #E7E5DE" }}
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg shrink-0 bg-slate-100">
              <ShieldCheck className="w-6 h-6 text-[#64748B]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Designing your own materials</h2>
              <p className="text-sm text-[#334155] leading-relaxed">
                Planning to design something yourself instead of using the Real templates? Real Brokerage has specific rules about logo usage, color, fonts, required disclosures, and what needs pre-approval before printing.
              </p>
              <p className="text-sm text-[#64748B] italic mt-2 leading-relaxed">
                Detailed DIY guidelines coming soon — Jacques will add these directly from the Real brand team. For now, use the Brand Guidelines link above as your source of truth.
              </p>
            </div>
          </div>
        </div>

        {/* ── Completion Card ───────────────────────────────────────────────── */}
        <div
          className="shadow-soft rounded-xl p-6 mb-12"
          style={
            isCompleted
              ? { backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }
              : { backgroundColor: "#F973161A", border: "1px solid #F9731622" }
          }
        >
          <h2 className="text-xl font-semibold text-[#0F172A] mb-2">Mark Signs &amp; Swag complete</h2>
          <p className="text-sm text-[#64748B] mb-5">
            <strong>{completedCount} of 6</strong> steps complete.
            {" "}Brand guidelines reviewed: <strong>{guidelinesOk ? "Yes" : "Not yet"}</strong>.
          </p>

          {isCompleted ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <Check className="w-5 h-5" />
              Signs &amp; Swag complete
            </div>
          ) : (
            <>
              <button
                onClick={markComplete}
                disabled={!canComplete || saving}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-colors
                            ${canComplete && !saving
                              ? "bg-[#FF6B35] hover:bg-[#E85A24] text-white"
                              : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
              >
                {saving ? "Saving…" : "Complete Signs & Swag"}
              </button>
              {!canComplete && (
                <p className="text-xs text-[#64748B] mt-2">
                  Requires: Business Cards ordered, at least one other item ordered, and Brand Guidelines reviewed.
                </p>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
