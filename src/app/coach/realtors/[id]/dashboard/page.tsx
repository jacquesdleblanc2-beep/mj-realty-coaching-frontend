"use client";

// src/app/coach/realtors/[id]/dashboard/page.tsx — Read-only realtor dashboard for coaches

import React, { use, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getRealtor, getProgress, getAllProgress,
  Realtor, WeekProgress, ProgressTask, ScoreHistoryEntry,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function currentWeekLabel(): string {
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function todayKey(): string { return new Date().toISOString().slice(0, 10); }

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function daysSince(d: string | undefined): string {
  if (!d) return "never";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "today" : diff === 1 ? "1 day ago" : `${diff} days ago`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function streak(history: { percentage: number }[]): number {
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].percentage >= 60) n++;
    else break;
  }
  return n;
}

function getGreeting(name: string, pct: number): string {
  if (pct >= 90) return `${name} is crushing it this week.`;
  if (pct >= 75) return `Strong week so far for ${name}.`;
  if (pct >= 60) return `${name} is on track this week.`;
  if (pct >= 40) return `${name} needs to turn it around this week.`;
  const day = new Date().getDay();
  if (day === 1) return `New week for ${name}. Let's see how it goes.`;
  if (day >= 2 && day <= 4) return `Mid-week check-in for ${name}.`;
  if (day === 5) return `End-of-week view for ${name}.`;
  return `Weekend snapshot for ${name}.`;
}

function shortWeekLabel(wl: string): string {
  const m = wl.match(/Week of (\w+ \d+)/);
  return m ? m[1] : wl.slice(0, 8);
}

function earnedPoints(t: ProgressTask): number {
  if (t.input_type === "count" || t.type === "count") {
    const target = t.target ?? 1;
    const total  = t.weekly_total ?? 0;
    return Math.round(Math.min(total / target, 1.0) * t.points * 10) / 10;
  }
  return t.done ? t.points : 0;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

// ── Stats bar ──────────────────────────────────────────────────────────────────

function StatsBar({ livePercent, lastWeekPct, avgPct, streakWeeks, loading }: {
  livePercent: number; lastWeekPct: number; avgPct: number; streakWeeks: number; loading: boolean;
}) {
  if (loading) return <Skeleton className="h-16 mb-6 rounded-xl" />;

  function pill(pct: number) {
    if (pct >= 75) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Strong</span>;
    if (pct >= 60) return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">On Track</span>;
    if (pct > 0)   return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-600 font-medium">Needs Work</span>;
    return null;
  }

  const stats = [
    { label: "This week",  value: livePercent > 0 ? `${livePercent}%` : "—", sub: pill(livePercent) },
    { label: "Last week",  value: lastWeekPct > 0 ? `${lastWeekPct}%` : "—", sub: pill(lastWeekPct) },
    { label: "4-week avg", value: avgPct > 0       ? `${avgPct}%`      : "—", sub: <span className="text-[10px] text-teal-400">rolling</span> },
    {
      label: "Streak",
      value: streakWeeks > 0 ? `🔥 ${streakWeeks}` : "—",
      sub: <span className="text-[10px] text-teal-400">{streakWeeks > 0 ? `${streakWeeks === 1 ? "week" : "weeks"} above 60%` : "above 60%"}</span>,
    },
  ];

  return (
    <div className="bg-white border border-teal-200 rounded-xl flex divide-x divide-teal-100 mb-6">
      {stats.map((s, i) => (
        <div key={i} className="flex-1 px-5 py-3">
          <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-0.5">{s.label}</p>
          <p className="text-[28px] font-medium text-teal-800 leading-none mb-1">{s.value}</p>
          <div className="h-4">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Today's focus (read-only) ──────────────────────────────────────────────────

const DAILY_ITEMS = [
  "Made my prospecting calls",
  "Followed up with all active clients",
  "Added value to someone in my network today",
];

function ReadOnlyTodaysFocus({ progress }: { progress: WeekProgress | null }) {
  const key   = todayKey();
  const items = progress?.daily_focus?.[key] ?? [false, false, false];
  const allDone = items.every(Boolean);

  return (
    <div className="bg-white border border-teal-200 rounded-xl px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-teal-800">Today&apos;s focus</p>
          <p className="text-xs text-teal-400">{todayLabel()}</p>
        </div>
        {allDone && (
          <span className="text-xs text-green-600 font-medium bg-green-50 px-2.5 py-1 rounded-full">
            All done today! 🎯
          </span>
        )}
      </div>
      <div className="flex gap-6 flex-wrap">
        {DAILY_ITEMS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-teal-700">
            <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center
                              ${items[i] ? "bg-teal-600 border-teal-600" : "border-teal-200"}`}>
              {items[i] && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={items[i] ? "line-through text-teal-400" : ""}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Goals tracker (read-only) ──────────────────────────────────────────────────

function ReadOnlyGoalsTracker({ realtor }: { realtor: Realtor }) {
  const goals   = realtor.yearly_goals;
  const yearPct = Math.min(100, Math.round(
    (new Date().getMonth() * 30 + new Date().getDate()) / 365 * 100
  ));

  function pace(current: number, target: number): { text: string; cls: string } {
    if (!target) return { text: "No target", cls: "bg-teal-100 text-teal-500" };
    const pct = (current / target) * 100;
    if (pct >= yearPct + 10) return { text: "Ahead",      cls: "bg-teal-100 text-teal-700" };
    if (pct >= yearPct - 5)  return { text: "On Pace",    cls: "bg-green-100 text-green-700" };
    if (pct >= yearPct - 20) return { text: "Needs Push", cls: "bg-amber-100 text-amber-700" };
    return                          { text: "Behind",     cls: "bg-red-100 text-red-700" };
  }

  const rows = [
    { label: "GCI",          current: realtor.current_gci     ?? 0, target: goals?.conservative_gci ?? 0, fmt: (n: number) => `$${n.toLocaleString()}` },
    { label: "Total Deals",  current: realtor.current_deals   ?? 0, target: goals?.total_deals  ?? 0, fmt: String },
    { label: "Buyer Deals",  current: realtor.current_buyers  ?? 0, target: goals?.buyer_deals  ?? 0, fmt: String },
    { label: "Seller Deals", current: realtor.current_sellers ?? 0, target: goals?.seller_deals ?? 0, fmt: String },
  ];

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-teal-800">2026 Goals — Where they&apos;re at</h2>
          {realtor.last_goals_updated && (
            <p className="text-[10px] text-teal-400 mt-0.5">Last updated: {daysSince(realtor.last_goals_updated)}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((row) => {
          const pct = row.target ? Math.min(100, Math.round((row.current / row.target) * 100)) : 0;
          const { text, cls } = pace(row.current, row.target);
          return (
            <div key={row.label} className="bg-teal-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wider text-teal-500 font-medium">{row.label}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cls}`}>{text}</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 bg-teal-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full rounded-full transition-all duration-500"
                       style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] text-teal-600 font-medium shrink-0">{pct}%</span>
              </div>
              <p className="text-xs text-teal-700">
                <strong>{row.fmt(row.current)}</strong>
                <span className="text-teal-400"> / {row.fmt(row.target)}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Read-only task table ───────────────────────────────────────────────────────

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function ReadOnlyTaskTable({ progress }: { progress: WeekProgress }) {
  const byCategory: [string, ProgressTask[]][] = [];
  const seen = new Set<string>();
  for (const t of progress.tasks) {
    if (!seen.has(t.category)) { seen.add(t.category); byCategory.push([t.category, []]); }
    byCategory.find(([c]) => c === t.category)![1].push(t);
  }

  const totalEarned   = progress.tasks.reduce((s, t) => s + earnedPoints(t), 0);
  const totalPossible = progress.tasks.reduce((s, t) => s + t.points, 0);
  const totalPct      = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 0;

  return (
    <div className="bg-white border border-teal-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "35%" }} />
            {WEEK_DAYS.map((d) => <col key={d} style={{ width: "7%" }} />)}
            <col style={{ width: "8%" }} />
            <col style={{ width: "7%" }} />
          </colgroup>
          <thead>
            <tr className="bg-teal-600">
              <th className="text-left px-4 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">Task</th>
              {WEEK_DAYS.map((d) => (
                <th key={d} className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">{d}</th>
              ))}
              <th className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">Total</th>
              <th className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">✓</th>
            </tr>
          </thead>
          <tbody>
            {byCategory.map(([cat, tasks]) => (
              <React.Fragment key={`group-${cat}`}>
                <tr className="bg-teal-100">
                  <td colSpan={10} className="px-4 py-1.5 text-[11px] font-medium text-teal-700 uppercase tracking-wider">{cat}</td>
                </tr>
                {tasks.map((t, rowIdx) => {
                  const isCount = t.input_type === "count" || t.type === "count";
                  const ep      = earnedPoints(t);
                  const target  = t.target ?? 1;
                  const total   = t.weekly_total ?? 0;
                  const ptsCls  = t.done ? "text-green-600" : ep > 0 ? "text-teal-500" : "text-gray-400";

                  return (
                    <tr key={t.task} className={rowIdx % 2 === 0 ? "bg-white" : "bg-teal-50"}>
                      <td className="px-4 py-2.5">
                        <p className={`text-[13px] leading-tight ${t.done ? "text-teal-400 line-through" : "text-teal-800"}`}>{t.task}</p>
                        <p className={`text-[10px] mt-0.5 ${ptsCls}`}>
                          {t.done ? `${t.points} / ${t.points} pts ✓` : ep > 0 ? `${ep} / ${t.points} pts` : `0 / ${t.points} pts`}
                          {isCount && !t.done && <span className="text-teal-300 ml-1">(goal: {target})</span>}
                        </p>
                      </td>
                      {FULL_DAYS.map((fullDay, di) => {
                        if (!isCount) return (
                          <td key={WEEK_DAYS[di]} className="text-center px-1 py-2 bg-gray-50 text-gray-300 text-[11px]">—</td>
                        );
                        const val = t.daily_counts?.[fullDay] ?? 0;
                        return (
                          <td key={WEEK_DAYS[di]} className="text-center px-1 py-2">
                            <span className={`text-[13px] font-medium ${val > 0 ? "text-teal-700" : "text-gray-300"}`}>{val || "—"}</span>
                          </td>
                        );
                      })}
                      <td className="text-center px-1 py-2">
                        {isCount ? (
                          <span className={`text-[12px] font-medium ${total >= target ? "text-teal-800" : "text-teal-500"}`}>{total}/{target}</span>
                        ) : <span className="text-gray-300 text-[11px]">—</span>}
                      </td>
                      <td className="text-center px-1 py-2">
                        <span className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center ${t.done ? "bg-teal-600 border-teal-600" : "border-teal-200"}`}>
                          {t.done && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-teal-200 bg-teal-50">
              <td colSpan={10} className="px-4 py-2.5 text-right text-[12px] font-medium text-teal-600">
                Total score this week:&nbsp;
                <span className="text-teal-800">{Math.round(totalEarned)} / {totalPossible} pts ({totalPct}%)</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Insight chart ──────────────────────────────────────────────────────────────

const CATEGORIES = ["Prospecting", "Listings / Buyers", "Follow-Up", "Social / Brand", "Education"];
const CAT_COLORS: Record<string, string> = {
  "Prospecting":       "#0D5C63",
  "Listings / Buyers": "#2d7d74",
  "Follow-Up":         "#4A9A92",
  "Social / Brand":    "#FF6B35",
  "Education":         "#B2DFDB",
};

function computeCategoryPct(tasks: ProgressTask[], cat: string): number {
  const catTasks = tasks.filter((t) => {
    const tc = t.category.replace(/ \/ /g, "/").replace(/\//g, " / ");
    return tc === cat && t.enabled;
  });
  const total  = catTasks.reduce((s, t) => s + t.points, 0);
  if (!total) return 0;
  const earned = catTasks.reduce((s, t) => s + (t.earned_points ?? (t.done ? t.points : 0)), 0);
  return Math.round((earned / total) * 100);
}

type ChartFilter = "all" | string;
const FILTER_OPTIONS = [
  { value: "all", label: "All categories" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

function InsightChart({ history, allProgress }: { history: ScoreHistoryEntry[]; allProgress: WeekProgress[] }) {
  const [filter, setFilter] = useState<ChartFilter>("all");

  if (history.length < 2) {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-teal-800 mb-1">Performance over time</h2>
        <p className="text-sm text-teal-400 italic text-center py-8">Trends appear after 2 weeks of data.</p>
      </div>
    );
  }

  const weeks = history.map((h) => {
    const prog = allProgress.find((p) => p.week_label === h.week_label);
    return {
      week_label: h.week_label,
      short:      shortWeekLabel(h.week_label),
      catPcts:    prog ? Object.fromEntries(CATEGORIES.map((c) => [c, computeCategoryPct(prog.tasks, c)])) : null,
    };
  });

  const CHART_H = 120;
  const SVG_W = 600; const SVG_H = CHART_H;
  const PAD_L = 32; const PAD_R = 12; const PAD_T = 8; const PAD_B = 24;
  const plotW = SVG_W - PAD_L - PAD_R; const plotH = SVG_H - PAD_T - PAD_B;
  const GRID  = [100, 75, 50, 25, 0];

  function xPos(i: number) { return weeks.length < 2 ? PAD_L + plotW / 2 : PAD_L + (i / (weeks.length - 1)) * plotW; }
  function yPos(pct: number) { return PAD_T + plotH - (pct / 100) * plotH; }
  function makePath(pts: number[]) { return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(p).toFixed(1)}`).join(" "); }

  const isAll    = filter === "all";
  const lineData = isAll ? CATEGORIES.map((cat) => ({ cat, color: CAT_COLORS[cat], points: weeks.map((w) => w.catPcts?.[cat] ?? 0) })) : [];
  const barData  = isAll ? [] : weeks.map((w, i) => ({ label: w.short, value: w.catPcts?.[filter] ?? 0, color: i === weeks.length - 1 ? "#0D5C63" : "#2d7d74" }));
  const maxBarVal = isAll ? 100 : Math.max(...barData.map((b) => b.value), 1);

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-teal-800 shrink-0">Performance over time</h2>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {FILTER_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                filter === o.value ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-600 border-teal-200 hover:border-teal-400"
              }`}>{o.label}</button>
          ))}
        </div>
      </div>

      {isAll ? (
        <div className="relative">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ height: CHART_H }} preserveAspectRatio="none">
            {GRID.map((g) => (
              <g key={g}>
                <line x1={PAD_L} y1={yPos(g)} x2={SVG_W - PAD_R} y2={yPos(g)} stroke="#ccfbf1" strokeWidth="0.5" strokeDasharray="3,3" />
                <text x={PAD_L - 4} y={yPos(g) + 3} textAnchor="end" fontSize="8" fill="#99d6cf">{g}%</text>
              </g>
            ))}
            {lineData.map((series) => (
              <g key={series.cat}>
                <path d={makePath(series.points)} fill="none" stroke={series.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {series.points.map((p, i) => (
                  <circle key={i} cx={xPos(i)} cy={yPos(p)} r="3" fill={series.color}><title>{series.cat}: {p}%</title></circle>
                ))}
              </g>
            ))}
            {weeks.map((w, i) => (
              <text key={w.week_label} x={xPos(i)} y={SVG_H - 4} textAnchor="middle" fontSize="8" fill="#99d6cf">{w.short}</text>
            ))}
          </svg>
          <div className="flex flex-wrap gap-3 mt-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className="text-[10px] text-teal-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2" style={{ height: CHART_H }}>
          {barData.map((b) => {
            const barH = Math.max(4, Math.round((b.value / maxBarVal) * (CHART_H - 20)));
            return (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                <span className="text-[10px] font-medium" style={{ color: b.color }}>{b.value}%</span>
                <div className="w-full rounded-t-sm" style={{ height: barH, backgroundColor: b.color }} />
                <span className="text-[9px] text-teal-400 truncate w-full text-center">{b.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CoachRealtorDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }                    = use(params);
  const { data: session, status } = useSession();
  const router                    = useRouter();

  const [realtor,     setRealtor]     = useState<Realtor | null>(null);
  const [progress,    setProgress]    = useState<WeekProgress | null>(null);
  const [allProgress, setAllProgress] = useState<WeekProgress[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  const weekLabel = currentWeekLabel();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const r = await getRealtor(id);
        setRealtor(r);
        const [prog, allProg] = await Promise.all([
          getProgress(r.id, weekLabel),
          getAllProgress(r.id),
        ]);
        setProgress(prog);
        setAllProgress(allProg);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [status, id, weekLabel]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  const firstName   = (realtor?.name ?? "").split(" ")[0];
  const history     = realtor?.score_history ?? [];
  const last4       = history.slice(-4).map((h) => h.percentage);
  const livePercent = progress?.percentage ?? history.at(-1)?.percentage ?? 0;
  const lastWeekPct = history.at(-1)?.percentage ?? 0;
  const avgPct      = avg(last4);
  const streakWeeks = streak(history);
  const PLACEHOLDER = "Work hard be kind";
  const hasGoals    = realtor?.martin_goals && realtor.martin_goals.trim() !== PLACEHOLDER;

  const historyWithCurrent: ScoreHistoryEntry[] = (() => {
    if (!progress) return history;
    const existing = history.find((h) => h.week_label === weekLabel);
    if (existing) return history.map((h) =>
      h.week_label === weekLabel ? { ...h, score: progress.score, percentage: progress.percentage } : h
    );
    return [...history, { week_label: weekLabel, score: progress.score, total_possible: progress.total_possible, percentage: progress.percentage, date: todayKey() }];
  })();

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Back button */}
        <a
          href={`/coach/realtors/${id}`}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white
                     text-sm font-medium px-4 py-2 rounded-xl transition-colors mb-6"
        >
          ← Back to Coach View
        </a>

        {/* Read-only banner */}
        <div className="flex items-center gap-2 bg-teal-600 text-white text-xs font-medium
                        px-4 py-2.5 rounded-xl mb-6">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
            <path d="M8 5v3.5M8 11h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          You are viewing {realtor?.name ?? "this realtor"}&apos;s dashboard as them — read only
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Greeting + week label */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-teal-800 leading-snug">
            {firstName ? getGreeting(firstName, livePercent) : "—"}
          </h1>
          <p className="text-sm text-teal-400 mt-1">{weekLabel}</p>
        </div>

        {/* Stats bar */}
        <StatsBar
          livePercent={livePercent}
          lastWeekPct={lastWeekPct}
          avgPct={avgPct}
          streakWeeks={streakWeeks}
          loading={false}
        />

        {/* Today's focus */}
        <ReadOnlyTodaysFocus progress={progress} />

        {/* Goals banner */}
        <div className="bg-teal-600 rounded-xl px-5 py-3 mb-6">
          <p className="text-teal-200 text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Your coach&apos;s goals for you this week
          </p>
          {hasGoals ? (
            <ul className="space-y-0.5">
              {realtor!.martin_goals.split("\n").filter(Boolean).map((g, i) => (
                <li key={i} className="text-white text-sm">• {g.replace(/^[•\-*]\s*/, "")}</li>
              ))}
            </ul>
          ) : (
            <p className="text-teal-300 text-sm italic">No goals set for this week yet.</p>
          )}
        </div>

        {/* Goals tracker */}
        {realtor && <ReadOnlyGoalsTracker realtor={realtor} />}

        {/* Weekly task table */}
        {progress ? (
          <div className="mb-6">
            <p className="text-xs font-semibold text-teal-500 uppercase tracking-wider mb-3">Weekly tasks</p>
            <ReadOnlyTaskTable progress={progress} />
          </div>
        ) : (
          <div className="bg-white border border-teal-200 rounded-xl px-6 py-8 text-center mb-6">
            <p className="text-teal-400 text-sm">No progress recorded for this week yet.</p>
          </div>
        )}

        {/* Insights chart */}
        <InsightChart history={historyWithCurrent} allProgress={allProgress} />

      </main>
    </div>
  );
}
