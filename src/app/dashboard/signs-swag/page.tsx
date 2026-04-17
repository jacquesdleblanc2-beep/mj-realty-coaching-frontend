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

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="bg-white border border-[#B2DFDB] rounded-xl p-4 mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[#0D5C63]">{done} of {total} items ordered</span>
        <span className="text-sm font-bold text-[#0D5C63]">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-[#B2DFDB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#0D5C63] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
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
  return (
    <div
      className={`flex flex-col bg-white rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow
                  ${checked
                    ? "border-l-4 border-l-[#0D5C63] border-[#B2DFDB] bg-gradient-to-br from-white to-[#F0FAFA]/40"
                    : "border-[#B2DFDB]"}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="bg-[#F0FAFA] rounded-lg p-2.5 shrink-0">
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

      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{desc}</p>

      {/* Vendors */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                  className="inline-flex items-center gap-1 text-sm text-[#0D5C63] hover:underline"
                >
                  {v.label}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
                {v.note && (
                  <span className="text-xs text-slate-400 ml-1">— {v.note}</span>
                )}
              </li>
            ) : (
              <li key={i} className="text-sm text-slate-500">
                {v.label}
                {v.note && (
                  <span className="text-slate-400 ml-1">— {v.note}</span>
                )}
              </li>
            )
          )}
        </ul>
      </div>

      {/* Checkbox */}
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
    // Optimistic update
    setCompleted(next);
    try {
      const updated = await updateRealtor(realtor.id, { roadmap_completed: next });
      setRealtor(updated);
      setCompleted(updated.roadmap_completed ?? next);
    } catch (e) {
      console.error("Failed to save", e);
      // Revert
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
  const orderedCount   = MATERIAL_KEYS.filter((k) => completed.includes(k)).length;
  const otherOrdered   = MATERIAL_KEYS.filter((k) => k !== KEY_BIZ_CARDS && completed.includes(k)).length;
  const canComplete    = bizCardsOk && otherOrdered >= 1 && guidelinesOk && !isCompleted;

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#F0FAFA] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  // ── Material card data ────────────────────────────────────────────────────────

  const materials: Omit<MaterialCardProps, "checked" | "onToggle" | "saving">[] = [
    {
      icon:     <CreditCard className="w-5 h-5 text-[#0D5C63]" />,
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
      icon:     <Home className="w-5 h-5 text-[#0D5C63]" />,
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
      icon:     <MapPin className="w-5 h-5 text-[#0D5C63]" />,
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
      icon:     <IdCard className="w-5 h-5 text-[#0D5C63]" />,
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
      icon:     <Sparkles className="w-5 h-5 text-[#0D5C63]" />,
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
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase">Initial Setup</p>
          <h1 className="text-3xl font-bold text-[#0D5C63] mt-2">Signs &amp; Swag</h1>
          <p className="text-slate-600 mt-2 max-w-3xl">
            Your brand in the real world. Listing signs, business cards, open house materials — designed the Real way, printed by vendors you choose.
          </p>
        </div>

        <ProgressBar done={orderedCount} total={MATERIAL_KEYS.length} />

        {/* ── Brand Hub Cards ───────────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-[#FF6B35] uppercase tracking-wider">Start Here</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">Your REAL brand toolkit</h2>
          <p className="text-sm text-slate-600 mt-1">
            Before you order anything, download what you need from Real Brokerage&apos;s brand portals. Every piece of your marketing — from signs to social — uses these assets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

          {/* Brand Guidelines */}
          <div className="bg-white border border-[#B2DFDB] border-l-4 border-l-[#0D5C63] rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#F0FAFA] p-3 rounded-lg shrink-0">
                <BookOpen className="w-6 h-6 text-[#0D5C63]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Brand Guidelines</h3>
                <p className="text-sm text-slate-600 mt-1">
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
                className="flex items-center gap-2 self-start text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                              ${guidelinesOk
                                ? "bg-[#0D5C63] border-[#0D5C63]"
                                : "border-slate-300 hover:border-[#0D5C63]"}`}
                >
                  {guidelinesOk && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </span>
                I&apos;ve reviewed the brand guidelines
              </button>
            </div>
          </div>

          {/* Brand Elements Portal */}
          <div className="bg-white border border-[#B2DFDB] border-l-4 border-l-[#0D5C63] rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#F0FAFA] p-3 rounded-lg shrink-0">
                <Download className="w-6 h-6 text-[#0D5C63]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Brand Elements Portal</h3>
                <p className="text-sm text-slate-600 mt-1">
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

        {/* ── Materials Grid ────────────────────────────────────────────────── */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Materials</p>
          <h2 className="text-xl font-semibold text-slate-800 mt-1">What you&apos;ll need</h2>
          <p className="text-sm text-slate-600 mt-1">
            The essentials for your first 90 days. Check items off as you order them.
          </p>
        </div>

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
        <div className="bg-white border border-[#B2DFDB] border-l-4 border-l-[#0D5C63] rounded-xl p-6 shadow-sm mb-12">
          <div className="flex items-start gap-4">
            <div className="bg-[#F0FAFA] p-2 rounded-lg shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#0D5C63]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-800 mb-2">Designing your own materials</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Planning to design something yourself instead of using the Real templates? Real Brokerage has specific rules about logo usage, color, fonts, required disclosures, and what needs pre-approval before printing.
              </p>
              <p className="text-sm text-slate-500 italic mt-2 leading-relaxed">
                Detailed DIY guidelines coming soon — Jacques will add these directly from the Real brand team. For now, use the Brand Guidelines link above as your source of truth.
              </p>
            </div>
          </div>
        </div>

        {/* ── Completion Card ───────────────────────────────────────────────── */}
        <div
          className={`bg-white rounded-xl p-6 shadow-sm border border-l-4 transition-colors mb-12
                      ${isCompleted
                        ? "border-[#B2DFDB] border-l-[#0D5C63]"
                        : "border-[#B2DFDB] border-l-[#FF6B35]"}`}
        >
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Mark Signs &amp; Swag complete</h2>
          <p className="text-sm text-slate-500 mb-5">
            You&apos;ve ordered <strong>{orderedCount} of {MATERIAL_KEYS.length}</strong> materials.
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
                <p className="text-xs text-slate-400 mt-2">
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
