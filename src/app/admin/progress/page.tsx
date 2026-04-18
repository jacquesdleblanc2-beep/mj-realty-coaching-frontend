"use client";

// src/app/admin/progress/page.tsx — Realtor checklist completion table

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const API         = process.env.NEXT_PUBLIC_API_URL;
const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

// ── Checklist registry ─────────────────────────────────────────────────────────

interface ChecklistItem {
  key:     string;
  label:   string;
  section: string;
  accent:  string;
}

const CHECKLIST: ChecklistItem[] = [
  // Licensing — New (blue)
  { key: "licensing_new_1",  label: "NBREA Membership Application",     section: "Licensing (New)",      accent: "#3B82F6" },
  { key: "licensing_new_2",  label: "FCNB Licence Application",         section: "Licensing (New)",      accent: "#3B82F6" },
  { key: "licensing_new_3",  label: "NBRE Board Final Transfer",        section: "Licensing (New)",      accent: "#3B82F6" },
  // Licensing — Transfer (blue)
  { key: "licensing_xfer_1", label: "NBREA Membership Transfer",        section: "Licensing (Transfer)", accent: "#3B82F6" },
  { key: "licensing_xfer_2", label: "FCNB New Licence Application",     section: "Licensing (Transfer)", accent: "#3B82F6" },
  { key: "licensing_xfer_3", label: "Previous Brokerage Cancels",       section: "Licensing (Transfer)", accent: "#3B82F6" },
  { key: "licensing_xfer_4", label: "NBRE Board Final Transfer",        section: "Licensing (Transfer)", accent: "#3B82F6" },
  // Systems Setup (violet)
  { key: "syssetup_matrix",      label: "Matrix (MLS)",                 section: "Systems Setup",        accent: "#8B5CF6" },
  { key: "syssetup_paol",        label: "PAOL SNB",                     section: "Systems Setup",        accent: "#8B5CF6" },
  { key: "syssetup_real_academy",label: "REAL Academy",                 section: "Systems Setup",        accent: "#8B5CF6" },
  { key: "syssetup_snb_planet",  label: "SNB PLANET",                   section: "Systems Setup",        accent: "#8B5CF6" },
  { key: "syssetup_supra_ekey",  label: "Supra eKey",                   section: "Systems Setup",        accent: "#8B5CF6" },
  { key: "syssetup_touchbase",   label: "Touchbase",                    section: "Systems Setup",        accent: "#8B5CF6" },
  // Email Setup (teal)
  { key: "email_setup_gmail",    label: "Gmail work account",           section: "Email Setup",          accent: "#0D5C63" },
  { key: "email_setup_signature",label: "Email signature",              section: "Email Setup",          accent: "#0D5C63" },
  { key: "email_setup_forward",  label: "Forwarding / filters",         section: "Email Setup",          accent: "#0D5C63" },
  // Signs & Swag (orange)
  { key: "swag_business_cards",  label: "Business cards",               section: "Signs & Swag",         accent: "#F97316" },
  { key: "swag_for_sale_sign",   label: "For Sale sign",                section: "Signs & Swag",         accent: "#F97316" },
  { key: "swag_open_house_sign", label: "Open House sign",              section: "Signs & Swag",         accent: "#F97316" },
  { key: "swag_lockbox",         label: "Lockbox",                      section: "Signs & Swag",         accent: "#F97316" },
  { key: "swag_guidelines",      label: "Brand guidelines reviewed",    section: "Signs & Swag",         accent: "#F97316" },
];

// Unique section names in display order
const SECTIONS = [...new Set(CHECKLIST.map((c) => c.section))];

// ── Types ──────────────────────────────────────────────────────────────────────

interface RealtorRow {
  id:        string;
  name:      string;
  email:     string;
  completed: Set<string>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function dot(done: boolean, accent: string) {
  return (
    <span
      className="inline-flex w-5 h-5 rounded items-center justify-center text-[10px] font-bold"
      style={
        done
          ? { backgroundColor: "#D1FAE5", color: "#059669" }
          : { backgroundColor: "#F1F5F9", color: "#94A3B8" }
      }
      title={done ? "done" : "–"}
    >
      {done ? "✓" : "–"}
    </span>
  );
}

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminProgressPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rows,    setRows]    = useState<RealtorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [section, setSection] = useState<string>("all");

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
      return;
    }

    fetch(`${API}/api/realtors`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((realtors: { id: string; name: string; email: string; roadmap_completed: string[] | Record<string, string[]> | null }[]) => {
        const mapped: RealtorRow[] = realtors.map((r) => {
          let items: string[] = [];
          if (Array.isArray(r.roadmap_completed)) {
            items = r.roadmap_completed;
          } else if (r.roadmap_completed && typeof r.roadmap_completed === "object") {
            items = Object.values(r.roadmap_completed).flat();
          }
          return { id: r.id, name: r.name, email: r.email, completed: new Set(items) };
        });
        setRows(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [status, email, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F3] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const visibleItems = section === "all"
    ? CHECKLIST
    : CHECKLIST.filter((c) => c.section === section);

  return (
    <div className="min-h-screen bg-teal-50">

      {/* Top nav */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin" className="font-bold text-[#0D5C63] text-lg leading-none tracking-tight hover:opacity-80">NBR</a>
          <span className="font-semibold text-teal-800 text-sm">Admin</span>
          <span className="text-xs text-teal-300 border border-teal-200 px-2 py-0.5 rounded-full ml-1">
            super-admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/admin/roadmap"
             className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200 px-4 py-2 rounded-lg transition-colors">
            Roadmap →
          </a>
          <a href="/admin/notifications"
             className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200 px-4 py-2 rounded-lg transition-colors">
            Auto Notifications →
          </a>
          <a href="/admin/feedback"
             className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200 px-4 py-2 rounded-lg transition-colors">
            Feedback →
          </a>
          <a href="/admin/notices"
             className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200 px-4 py-2 rounded-lg transition-colors">
            Notices →
          </a>
          <a href="/admin/progress"
             className="text-sm text-teal-800 font-semibold border border-teal-600 bg-teal-50 px-4 py-2 rounded-lg">
            Progress
          </a>
          <a href="/admin/status"
             className="text-sm text-teal-600 hover:text-teal-800 border border-teal-200 px-4 py-2 rounded-lg transition-colors">
            System Status →
          </a>
          <span className="text-sm text-teal-600">{session?.user?.name ?? email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-teal-400 hover:text-teal-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="p-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-[#0F172A]">Realtor Progress</h1>
          <p className="text-sm text-slate-500 mt-0.5">Checklist completion across all Initial Setup sections.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            Failed to load: {error}
          </div>
        )}

        {/* Section filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", ...SECTIONS] as string[]).map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${section === s
                  ? "bg-[#0D5C63] border-[#0D5C63] text-white"
                  : "bg-white border-[#B2DFDB] text-[#0D5C63] hover:border-[#0D5C63]"}`}
            >
              {s === "all" ? "All sections" : s}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {SECTIONS.map((sec) => {
            const keys  = CHECKLIST.filter((c) => c.section === sec);
            const total = keys.length * rows.length;
            const done  = rows.reduce((sum, r) => sum + keys.filter((k) => r.completed.has(k.key)).length, 0);
            const accent = keys[0]?.accent ?? "#0D5C63";
            return (
              <button
                key={sec}
                onClick={() => setSection(sec === section ? "all" : sec)}
                className="text-left rounded-xl p-4 transition-shadow hover:shadow-soft-hover shadow-soft"
                style={{ backgroundColor: accent + "1A", border: `1px solid ${accent}22` }}
              >
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{sec}</p>
                <p className="text-2xl font-bold tabular-nums" style={{ color: accent }}>{pct(done, total)}%</p>
                <p className="text-xs text-slate-500 mt-0.5">{done}/{total} checks done</p>
              </button>
            );
          })}
        </div>

        {/* Table */}
        {rows.length > 0 && (
          <div className="bg-white rounded-xl shadow-soft overflow-x-auto border border-slate-100">
            <table className="w-full text-sm border-collapse">
              <thead>
                {/* Section header row */}
                <tr className="border-b border-slate-100">
                  <th className="sticky left-0 bg-white z-10 text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-48 border-r border-slate-100">
                    Realtor
                  </th>
                  {section === "all"
                    ? SECTIONS.map((sec) => {
                        const cols = CHECKLIST.filter((c) => c.section === sec);
                        const accent = cols[0]?.accent ?? "#0D5C63";
                        return (
                          <th
                            key={sec}
                            colSpan={cols.length}
                            className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-center border-r border-slate-100 last:border-r-0"
                            style={{ color: accent, backgroundColor: accent + "0D" }}
                          >
                            {sec}
                          </th>
                        );
                      })
                    : (
                      <th
                        colSpan={visibleItems.length}
                        className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-center"
                        style={{ color: visibleItems[0]?.accent ?? "#0D5C63", backgroundColor: (visibleItems[0]?.accent ?? "#0D5C63") + "0D" }}
                      >
                        {section}
                      </th>
                    )
                  }
                  <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-20 border-l border-slate-100">
                    Done
                  </th>
                </tr>
                {/* Column label row */}
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 bg-slate-50 z-10 text-left px-4 py-2 text-xs text-slate-400 font-medium border-r border-slate-100" />
                  {visibleItems.map((item) => (
                    <th
                      key={item.key}
                      className="px-1.5 py-2 text-[10px] font-medium text-slate-500 text-center max-w-[52px]"
                      title={item.label}
                    >
                      <span className="block truncate max-w-[52px]">{item.label.split(" ").slice(0, 2).join(" ")}</span>
                    </th>
                  ))}
                  <th className="px-4 py-2 border-l border-slate-100" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => {
                  const doneCount = visibleItems.filter((c) => row.completed.has(c.key)).length;
                  const total     = visibleItems.length;
                  const p         = pct(doneCount, total);
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors ${ri % 2 === 0 ? "" : "bg-slate-50/30"}`}
                    >
                      {/* Name */}
                      <td className="sticky left-0 bg-white z-10 px-4 py-3 border-r border-slate-100 hover:bg-slate-50/60">
                        <span className="font-medium text-[#0F172A] block">{row.name}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">{row.email}</span>
                      </td>

                      {/* Check dots */}
                      {visibleItems.map((item) => (
                        <td key={item.key} className="px-1.5 py-3 text-center">
                          {dot(row.completed.has(item.key), item.accent)}
                        </td>
                      ))}

                      {/* % badge */}
                      <td className="px-4 py-3 text-center border-l border-slate-100">
                        <span
                          className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums"
                          style={
                            p === 100
                              ? { backgroundColor: "#D1FAE5", color: "#059669" }
                              : p >= 50
                              ? { backgroundColor: "#DBEAFE", color: "#1D4ED8" }
                              : { backgroundColor: "#F1F5F9", color: "#64748B" }
                          }
                        >
                          {p}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length === 0 && !error && (
          <p className="text-sm text-slate-400 mt-8">No realtors found.</p>
        )}
      </div>
    </div>
  );
}
