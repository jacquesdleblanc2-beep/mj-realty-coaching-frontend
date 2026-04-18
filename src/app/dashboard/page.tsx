"use client";

// src/app/dashboard/page.tsx — Realtor dashboard

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getRealtorByEmail, getAllProgress, getProgress, patchTask, toggleTask,
  saveActivityCell, updateRealtor, saveDailyFocus, getCoachById,
  Realtor, WeekProgress, ActivityRow, ProgressTask, ScoreHistoryEntry,
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

function daysSince(d: string | undefined): string {
  if (!d) return "never";
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "today" : diff === 1 ? "1 day ago" : `${diff} days ago`;
}

function getGreeting(name: string, pct: number): string {
  if (pct >= 90) return `You're crushing it this week, ${name}.`;
  if (pct >= 75) return `Strong week so far, ${name}. Keep it up.`;
  if (pct >= 60) return `You're on track, ${name}. Keep pushing.`;
  if (pct >= 40) return `Time to turn it around, ${name}. You've got this.`;
  const day = new Date().getDay();
  if (day === 1) return `New week, new score. Let's go, ${name}.`;
  if (day >= 2 && day <= 4) return `Mid-week momentum. Make it count, ${name}.`;
  if (day === 5) return `Strong finish. Close out the week, ${name}.`;
  if (day === 6) return `Weekend grind. Every call counts, ${name}.`;
  return `Last chance to finish strong. Go, ${name}.`;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

// ── Compact stats bar ──────────────────────────────────────────────────────────

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
    { label: "This week",  value: livePercent > 0 ? `${livePercent}%` : "—",  sub: pill(livePercent) },
    { label: "Last week",  value: lastWeekPct > 0 ? `${lastWeekPct}%` : "—",  sub: pill(lastWeekPct) },
    { label: "4-week avg", value: avgPct > 0       ? `${avgPct}%`      : "—",  sub: <span className="text-[10px] text-teal-400">rolling</span> },
    {
      label: "Streak",
      value: streakWeeks > 0 ? `🔥 ${streakWeeks}` : "—",
      sub: streakWeeks > 0
        ? <span className="text-[10px] text-teal-400">{streakWeeks === 1 ? "week" : "weeks"} above 60%</span>
        : <span className="text-[10px] text-teal-400">above 60%</span>,
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

// ── Today's focus ──────────────────────────────────────────────────────────────

const DAILY_ITEMS = [
  "Made my prospecting calls",
  "Followed up with all active clients",
  "Added value to someone in my network today",
];

function TodaysFocus({ realtorId, weekLabel, progress }: {
  realtorId: string; weekLabel: string; progress: WeekProgress | null;
}) {
  const key   = todayKey();
  const saved = progress?.daily_focus?.[key] ?? [false, false, false];
  const [items, setItems] = useState<boolean[]>(saved);

  useEffect(() => {
    setItems(progress?.daily_focus?.[key] ?? [false, false, false]);
  }, [progress, key]);

  async function toggle(i: number) {
    const next = items.map((v, idx) => idx === i ? !v : v);
    setItems(next);
    await saveDailyFocus(realtorId, weekLabel, key, next).catch(() => {});
  }

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
          <button key={i} onClick={() => toggle(i)}
                  className="flex items-center gap-2 text-xs text-teal-700 group">
            <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all
                              ${items[i] ? "bg-teal-600 border-teal-600" : "border-teal-200 group-hover:border-teal-400"}`}>
              {items[i] && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={items[i] ? "line-through text-teal-400" : ""}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Goals tracker ──────────────────────────────────────────────────────────────

function GoalsTracker({ realtor, onUpdate }: { realtor: Realtor; onUpdate: (r: Realtor) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    current_gci:     realtor.current_gci     ?? 0,
    current_deals:   realtor.current_deals   ?? 0,
    current_buyers:  realtor.current_buyers  ?? 0,
    current_sellers: realtor.current_sellers ?? 0,
  });

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

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateRealtor(realtor.id, { ...form, last_goals_updated: todayKey() });
      onUpdate(updated);
      setEditing(false);
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-teal-800">2026 Goals — Where I&apos;m at</h2>
          {realtor.last_goals_updated && (
            <p className="text-[10px] text-teal-400 mt-0.5">Last updated: {daysSince(realtor.last_goals_updated)}</p>
          )}
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800
                             bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor"
                    strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Update numbers
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          {[
            { key: "current_gci",     label: "Current GCI ($)" },
            { key: "current_deals",   label: "Total deals closed" },
            { key: "current_buyers",  label: "Buyer deals" },
            { key: "current_sellers", label: "Seller deals" },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-xs text-teal-600 w-36 shrink-0">{label}</label>
              <input type="number" min={0} value={form[key as keyof typeof form]}
                     onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                     className="flex-1 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5
                                text-sm text-teal-800 focus:outline-none focus:border-teal-400" />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium
                               px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)}
                    className="text-xs text-teal-500 px-4 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
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
      )}
    </div>
  );
}

// ── Insights chart ─────────────────────────────────────────────────────────────

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
  const total = catTasks.reduce((s, t) => s + t.points, 0);
  if (!total) return 0;
  const earned = catTasks.reduce((s, t) => s + (t.earned_points ?? (t.done ? t.points : 0)), 0);
  return Math.round((earned / total) * 100);
}

function computeActivityTotal(log: ActivityRow[]): number {
  return log.reduce((sum, row) =>
    sum +
    (Number(row.Prospecting) || 0) +
    (Number(row["Listings / Buyers"]) || 0) +
    (Number(row["Follow-Up"]) || 0) +
    (Number(row["Social / Brand"]) || 0) +
    (Number(row.Education) || 0), 0);
}

function shortWeekLabel(wl: string): string {
  // Extract the Monday date: "Week of Mar 24 – Mar 30, 2026" → "Mar 24"
  const m = wl.match(/Week of (\w+ \d+)/);
  return m ? m[1] : wl.slice(0, 8);
}

type ChartFilter = "all" | "activity" | string;

const FILTER_OPTIONS = [
  { value: "all",      label: "All categories" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
  { value: "activity", label: "Activity totals" },
];

function InsightChart({
  history,
  allProgress,
}: {
  history: ScoreHistoryEntry[];
  allProgress: WeekProgress[];
}) {
  const [filter, setFilter] = useState<ChartFilter>("all");

  if (history.length < 2) {
    return (
      <div className="bg-white border border-teal-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-teal-800 mb-1">Performance over time</h2>
        <p className="text-sm text-teal-400 italic text-center py-8">
          Your performance trends will appear here after 2 weeks.<br />
          Keep filling in your weekly checklist!
        </p>
      </div>
    );
  }

  const weeks = history.map((h) => {
    const prog = allProgress.find((p) => p.week_label === h.week_label);
    return {
      week_label: h.week_label,
      short:      shortWeekLabel(h.week_label),
      overall:    h.percentage,
      catPcts:    prog
        ? Object.fromEntries(CATEGORIES.map((c) => [c, computeCategoryPct(prog.tasks, c)]))
        : null,
      actTotal:   prog ? computeActivityTotal(prog.activity_log ?? []) : 0,
    };
  });

  const CHART_H = 120; // px
  const GRID_LINES = [100, 75, 50, 25, 0];

  // For single-bar or multi-line modes
  function getBarData(): { label: string; value: number; color: string; isCurrent: boolean }[] {
    return weeks.map((w, i) => {
      const isCurrent = i === weeks.length - 1;
      if (filter === "activity") {
        const v = Math.min(100, Math.round((w.actTotal / 20) * 100));
        return { label: w.short, value: v, color: isCurrent ? "#c2410c" : "#f97316", isCurrent };
      }
      // single category
      const v = w.catPcts?.[filter] ?? 0;
      return { label: w.short, value: v, color: isCurrent ? "#0D5C63" : "#2d7d74", isCurrent };
    });
  }

  // For multi-line (all categories): series × weeks
  function getLineData(): { cat: string; color: string; points: number[] }[] {
    return CATEGORIES.map((cat) => ({
      cat,
      color: CAT_COLORS[cat],
      points: weeks.map((w) => w.catPcts?.[cat] ?? 0),
    }));
  }

  const isAll = filter === "all";
  const barData   = isAll ? [] : getBarData();
  const lineData  = isAll ? getLineData() : [];
  const maxBarVal = isAll ? 100 : Math.max(...barData.map((b) => b.value), 1);

  // SVG line chart dimensions
  const SVG_W = 600;
  const SVG_H = CHART_H;
  const PAD_L = 32;
  const PAD_R = 12;
  const PAD_T = 8;
  const PAD_B = 24;
  const plotW = SVG_W - PAD_L - PAD_R;
  const plotH = SVG_H - PAD_T - PAD_B;

  function xPos(i: number): number {
    if (weeks.length < 2) return PAD_L + plotW / 2;
    return PAD_L + (i / (weeks.length - 1)) * plotW;
  }
  function yPos(pct: number): number {
    return PAD_T + plotH - (pct / 100) * plotH;
  }
  function makePath(points: number[]): string {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(i).toFixed(1)} ${yPos(p).toFixed(1)}`)
      .join(" ");
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6">
      {/* Header + filter pills */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold text-teal-800 shrink-0">Performance over time</h2>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setFilter(o.value)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors font-medium ${
                filter === o.value
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-teal-600 border-teal-200 hover:border-teal-400"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      {isAll ? (
        /* ── Multi-line SVG chart ── */
        <div className="relative">
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ height: CHART_H }}
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {GRID_LINES.map((g) => (
              <g key={g}>
                <line
                  x1={PAD_L} y1={yPos(g)} x2={SVG_W - PAD_R} y2={yPos(g)}
                  stroke="#ccfbf1" strokeWidth="0.5" strokeDasharray="3,3"
                />
                <text x={PAD_L - 4} y={yPos(g) + 3} textAnchor="end"
                      fontSize="8" fill="#99d6cf">{g}%</text>
              </g>
            ))}

            {/* Lines */}
            {lineData.map((series) => (
              <g key={series.cat}>
                <path
                  d={makePath(series.points)}
                  fill="none"
                  stroke={series.color}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {series.points.map((p, i) => (
                  <circle key={i} cx={xPos(i)} cy={yPos(p)} r="3" fill={series.color}>
                    <title>{series.cat}: {p}%</title>
                  </circle>
                ))}
              </g>
            ))}

            {/* X-axis labels */}
            {weeks.map((w, i) => (
              <text key={w.week_label} x={xPos(i)} y={SVG_H - 4}
                    textAnchor="middle" fontSize="8" fill="#99d6cf">
                {w.short}
              </text>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm shrink-0"
                     style={{ backgroundColor: CAT_COLORS[cat] }} />
                <span className="text-[10px] text-teal-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Single bar chart ── */
        <div>
          <div className="flex items-end gap-2" style={{ height: CHART_H }}>
            {barData.map((b) => {
              const barH = Math.max(4, Math.round((b.value / maxBarVal) * (CHART_H - 20)));
              return (
                <div key={b.label} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
                  <span className="text-[10px] font-medium" style={{ color: b.color }}>{b.value}%</span>
                  <div className="w-full rounded-t-sm transition-all duration-300"
                       style={{ height: barH, backgroundColor: b.color }} />
                  <span className="text-[9px] text-teal-400 truncate w-full text-center">{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Week table ──────────────────────────────────────────────────────────────

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function earnedPoints(t: ProgressTask): number {
  if (t.input_type === "count" || t.type === "count") {
    const target = t.target ?? 1;
    const total  = t.weekly_total ?? 0;
    return Math.round(Math.min(total / target, 1.0) * t.points * 10) / 10;
  }
  return t.done ? t.points : 0;
}

function MyWeekTable({
  progress,
  realtorId,
  weekLabel,
  onUpdate,
}: {
  progress: WeekProgress;
  realtorId: string;
  weekLabel: string;
  onUpdate: (p: WeekProgress) => void;
}) {
  const [saving, setSaving] = useState<string | null>(null); // task name while saving
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFlash() {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
  }

  async function handleCountChange(task: ProgressTask, fullDay: string, raw: string) {
    // no lock — allow editing even after target is met
    const value = Math.max(0, parseInt(raw) || 0);
    setSaving(task.task);

    // Optimistic update
    onUpdate({
      ...progress,
      tasks: progress.tasks.map((t) => {
        if (t.task !== task.task) return t;
        const dc = { ...(t.daily_counts ?? {}), [fullDay]: value };
        const total = Object.values(dc).reduce((a, b) => a + b, 0);
        const target = t.target ?? 1;
        const done = total >= target;
        const ep = Math.round(Math.min(total / target, 1.0) * t.points * 10) / 10;
        return { ...t, daily_counts: dc, weekly_total: total, done, earned_points: ep };
      }),
    });

    try {
      const updated = await patchTask(realtorId, weekLabel, {
        task:   task.task,
        action: "set_count",
        day:    fullDay,
        value,
      });
      onUpdate(updated);
      showFlash();
    } catch {
      // revert
      onUpdate(progress);
    } finally {
      setSaving(null);
    }
  }

  async function handleYesNoToggle(task: ProgressTask) {
    setSaving(task.task);

    // Optimistic update
    onUpdate({
      ...progress,
      tasks: progress.tasks.map((t) =>
        t.task !== task.task ? t : { ...t, done: !t.done, earned_points: !t.done ? t.points : 0 }
      ),
    });

    try {
      const updated = await patchTask(realtorId, weekLabel, {
        task:   task.task,
        action: "toggle_yes_no",
      });
      onUpdate(updated);
      showFlash();
    } catch {
      onUpdate(progress);
    } finally {
      setSaving(null);
    }
  }

  // Group tasks by category
  const byCategory: [string, ProgressTask[]][] = [];
  const seen = new Set<string>();
  for (const t of progress.tasks) {
    if (!seen.has(t.category)) {
      seen.add(t.category);
      byCategory.push([t.category, []]);
    }
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

          {/* Header */}
          <thead>
            <tr className="bg-teal-600">
              <th className="text-left px-4 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">
                Task
              </th>
              {WEEK_DAYS.map((d) => (
                <th key={d} className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">
                  {d}
                </th>
              ))}
              <th className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">
                Total
              </th>
              <th className="text-center px-1 py-2.5 text-[11px] text-white uppercase tracking-wider font-medium">
                ✓
              </th>
            </tr>
          </thead>

          <tbody>
            {byCategory.map(([cat, tasks]) => (
              <React.Fragment key={`group-${cat}`}>
                {/* Category header row */}
                <tr className="bg-teal-100">
                  <td colSpan={10} className="px-4 py-1.5 text-[11px] font-medium text-teal-700 uppercase tracking-wider">
                    {cat}
                  </td>
                </tr>

                {/* Task rows */}
                {tasks.map((t, rowIdx) => {
                  const isCount = t.input_type === "count";
                  const ep      = earnedPoints(t);
                  const target  = t.target ?? 1;
                  const total   = t.weekly_total ?? 0;
                  const isSaving = saving === t.task;

                  const ptsCls = t.done
                    ? "text-green-600"
                    : ep > 0
                    ? "text-teal-500"
                    : "text-gray-400";

                  return (
                    <tr
                      key={t.task}
                      className={rowIdx % 2 === 0 ? "bg-white" : "bg-teal-50"}
                    >
                      {/* Task name cell */}
                      <td className="px-4 py-2.5">
                        <p className={`text-[13px] leading-tight ${t.done ? "text-teal-400 line-through" : "text-teal-800"}`}>
                          {t.task}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${ptsCls}`}>
                          {t.done
                            ? `${t.points} / ${t.points} pts ✓`
                            : ep > 0
                            ? `${ep} / ${t.points} pts`
                            : `0 / ${t.points} pts`}
                          {isCount && !t.done && (
                            <span className="text-teal-300 ml-1">(goal: {target})</span>
                          )}
                        </p>
                      </td>

                      {/* Day cells */}
                      {FULL_DAYS.map((fullDay, di) => {
                        const shortDay = WEEK_DAYS[di];
                        if (!isCount) {
                          return (
                            <td key={shortDay} className="text-center px-1 py-2 bg-gray-50 text-gray-300 text-[11px]">
                              —
                            </td>
                          );
                        }
                        const val = t.daily_counts?.[fullDay] ?? 0;
                        return (
                          <td key={shortDay} className="text-center px-1 py-2">
                            <input
                              type="number"
                              min={0}
                              defaultValue={val || ""}
                              key={`${t.task}-${fullDay}-${val}`}
                              placeholder="0"
                              disabled={isSaving}
                              onBlur={(e) => handleCountChange(t, fullDay, e.target.value)}
                              className="w-9 text-center text-[13px] border rounded py-1 focus:outline-none
                                         transition-colors bg-white border-teal-200 text-teal-800 focus:border-teal-400
                                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                                         [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        );
                      })}

                      {/* Total cell */}
                      <td className="text-center px-1 py-2">
                        {isCount ? (
                          <span className={`text-[12px] font-medium ${total >= target ? "text-teal-800" : "text-teal-500"}`}>
                            {total}/{target}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Done circle */}
                      <td className="text-center px-1 py-2">
                        {isCount ? (
                          <span className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center
                                            ${t.done ? "bg-teal-600 border-teal-600" : "border-teal-200"}`}>
                            {t.done && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5"
                                      strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleYesNoToggle(t)}
                            disabled={isSaving}
                            className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center
                                        transition-all cursor-pointer
                                        ${t.done
                                          ? "bg-teal-600 border-teal-600"
                                          : "border-teal-200 hover:border-teal-400"}`}
                          >
                            {t.done && (
                              <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5"
                                      strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>

          {/* Footer */}
          <tfoot>
            <tr className="border-t border-teal-200 bg-teal-50">
              <td colSpan={9} className="px-4 py-2.5 text-right text-[12px] font-medium text-teal-600">
                Total score this week:&nbsp;
                <span className="text-teal-800">{Math.round(totalEarned)} / {totalPossible} pts ({totalPct}%)</span>
              </td>
              <td className="px-1 py-2.5 text-center">
                <span className={`text-[11px] transition-opacity duration-500 font-medium
                                  ${savedFlash ? "text-green-600 opacity-100" : "text-transparent opacity-0"}`}>
                  ✓
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Quick numbers update ───────────────────────────────────────────────────────

function QuickNumbers({ realtor, onUpdate }: { realtor: Realtor; onUpdate: (r: Realtor) => void }) {
  const [form, setForm] = useState({
    current_gci:     realtor.current_gci     ?? 0,
    current_deals:   realtor.current_deals   ?? 0,
    current_buyers:  realtor.current_buyers  ?? 0,
    current_sellers: realtor.current_sellers ?? 0,
  });
  const [saving,  setSaving]  = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateRealtor(realtor.id, { ...form, last_goals_updated: todayKey() });
      onUpdate(updated);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2500);
    } finally { setSaving(false); }
  }

  const fields = [
    { key: "current_gci",     label: "GCI earned ($)" },
    { key: "current_deals",   label: "Deals closed" },
    { key: "current_buyers",  label: "Buyer deals" },
    { key: "current_sellers", label: "Seller deals" },
  ];

  return (
    <div className="mt-6 pt-5 border-t border-teal-100">
      <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-2">
        Update your 2026 progress — takes 10 seconds
      </p>
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
        <div className="flex flex-wrap gap-2 items-end">
          {fields.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1 min-w-[90px]">
              <label className="text-[10px] text-teal-500">{label}</label>
              <input
                type="number" min={0}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white border border-teal-200 rounded px-2 py-1 text-xs
                           text-teal-800 focus:outline-none focus:border-teal-400"
              />
            </div>
          ))}
          <button
            onClick={handleSave} disabled={saving}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium
                       px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 self-end"
          >
            {saving ? "…" : "Save"}
          </button>
          {savedOk && <span className="text-xs text-green-600 self-end pb-1">✓ Saved</span>}
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,     setRealtor]     = useState<Realtor | null>(null);
  const [progress,    setProgress]    = useState<WeekProgress | null>(null);
  const [allProgress, setAllProgress] = useState<WeekProgress[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [coachName,   setCoachName]   = useState<string>("Your coach");

  const weekLabel = currentWeekLabel();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email)
      .then(async (match) => {
        if (!match) {
          setError("Your account was not found. Ask your coach to add you.");
          setLoading(false);
          return;
        }
        setRealtor(match);
        if (match.coach_id) {
          getCoachById(match.coach_id).then((c) => { if (c?.name) setCoachName(c.name); }).catch(() => {});
        }
        const [prog, allProg] = await Promise.all([
          getProgress(match.id, weekLabel),
          getAllProgress(match.id),
        ]);
        setProgress(prog);
        setAllProgress(allProg);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, session, weekLabel]);

  // Keep allProgress in sync when current week progress updates
  const handleProgressUpdate = useCallback((updated: WeekProgress) => {
    setProgress(updated);
    setAllProgress((prev) => {
      const idx = prev.findIndex((p) => p.week_label === updated.week_label);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [...prev, updated];
    });
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  const firstName    = (session?.user?.name ?? realtor?.name ?? "").split(" ")[0];
  const history      = realtor?.score_history ?? [];
  const last4        = history.slice(-4).map((h) => h.percentage);
  const livePercent  = progress?.percentage ?? history.at(-1)?.percentage ?? 0;
  const lastWeekPct  = history.at(-1)?.percentage ?? 0;
  const avgPct       = avg(last4);
  const streakWeeks  = streak(history);
  const PLACEHOLDER  = "Work hard be kind";
  const hasGoals     = realtor?.martin_goals && realtor.martin_goals.trim() !== PLACEHOLDER;

  // Build score_history with current week for the insights chart
  const historyWithCurrent: ScoreHistoryEntry[] = (() => {
    if (!progress) return history;
    const existing = history.find((h) => h.week_label === weekLabel);
    if (existing) {
      return history.map((h) =>
        h.week_label === weekLabel
          ? { ...h, score: progress.score, percentage: progress.percentage }
          : h
      );
    }
    return [
      ...history,
      {
        week_label:     weekLabel,
        score:          progress.score,
        total_possible: progress.total_possible,
        percentage:     progress.percentage,
        date:           todayKey(),
      },
    ];
  })();

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-teal-800 leading-snug">
            {loading ? `Welcome back, ${firstName}.` : getGreeting(firstName, livePercent)}
          </h1>
          <p className="text-sm text-teal-400 mt-1">{weekLabel}</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Could not connect to API: {error}. Make sure the FastAPI server is running.
          </div>
        )}

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        <StatsBar livePercent={livePercent} lastWeekPct={lastWeekPct}
                  avgPct={avgPct} streakWeeks={streakWeeks} loading={loading} />

        {!loading && realtor && (
          <TodaysFocus realtorId={realtor.id} weekLabel={weekLabel} progress={progress} />
        )}

        {/* Coach goals banner */}
        <div className="bg-teal-600 rounded-xl px-5 py-3 mb-6">
          <p className="text-teal-200 text-[11px] uppercase tracking-wider font-medium mb-1.5">
            {`${coachName}'s goals for you this week`}
          </p>
          {hasGoals ? (
            <ul className="space-y-0.5">
              {realtor!.martin_goals.split("\n").filter(Boolean).map((line, i) => (
                <li key={i} className="text-white text-sm flex gap-2">
                  <span className="text-teal-300">•</span> {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-teal-300 text-sm italic">
              {`${coachName} hasn't set goals for this week yet. Check back Monday morning.`}
            </p>
          )}
        </div>

        {!loading && realtor && (
          <GoalsTracker realtor={realtor} onUpdate={setRealtor} />
        )}

        {!loading && (
          <InsightChart history={historyWithCurrent} allProgress={allProgress} />
        )}

      </main>
    </div>
  );
}
