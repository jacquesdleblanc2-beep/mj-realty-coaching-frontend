"use client";

// src/app/dashboard/history/page.tsx — My History (combined chart + week cards)

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getRealtors, getRealtorHistory, getProgress, toggleTask, saveProgress,
  Realtor, ScoreHistoryEntry, WeekProgress, ProgressTask,
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

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function scoreLabel(pct: number): { text: string; cls: string } {
  if (pct >= 90) return { text: "Excellent",  cls: "bg-green-100 text-green-700" };
  if (pct >= 75) return { text: "Strong",     cls: "bg-green-100 text-green-700" };
  if (pct >= 60) return { text: "On Track",   cls: "bg-amber-100 text-amber-700" };
  if (pct >= 40) return { text: "Needs Work", cls: "bg-red-100 text-red-700" };
  return           { text: "Off Track",  cls: "bg-red-100 text-red-700" };
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

// ── Bar chart ──────────────────────────────────────────────────────────────────

function HistoryChart({ history, currentWeek }: { history: ScoreHistoryEntry[]; currentWeek: string }) {
  if (!history.length) return <p className="text-teal-400 text-sm">No history yet.</p>;
  const max = Math.max(...history.map((h) => h.percentage), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 overflow-x-auto pb-1">
      {history.map((h, i) => {
        const isCurrent = h.week_label === currentWeek || i === history.length - 1;
        const barH = Math.max(6, Math.round((h.percentage / max) * 100));
        return (
          <div key={h.week_label} className="flex flex-col items-center gap-1 min-w-[28px] flex-1">
            <span className="text-[9px] text-teal-400 font-medium leading-none">{h.percentage}%</span>
            <div
              title={`${h.week_label}: ${h.percentage}%`}
              className={`w-full rounded-t-sm transition-all ${isCurrent ? "bg-teal-600" : "bg-teal-200"}`}
              style={{ height: barH }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Expandable week card ───────────────────────────────────────────────────────

function WeekCard({
  entry,
  isCurrentWeek,
  realtorId,
}: {
  entry: ScoreHistoryEntry;
  isCurrentWeek: boolean;
  realtorId: string;
}) {
  const [open,     setOpen]     = useState(false);
  const [progress, setProgress] = useState<WeekProgress | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [notes,    setNotes]    = useState("");
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { text, cls } = scoreLabel(entry.percentage);

  async function handleExpand() {
    if (isCurrentWeek) return; // current week edited on dashboard
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (progress) return;
    setLoading(true);
    try {
      const p = await getProgress(realtorId, entry.week_label);
      setProgress(p);
      setNotes(p.notes ?? "");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(taskName: string, currentDone: boolean) {
    if (!progress) return;
    const newDone = !currentDone;
    setProgress((p) => {
      if (!p) return p;
      return { ...p, tasks: p.tasks.map((t) => t.task === taskName ? { ...t, done: newDone } : t) };
    });
    const updated = await toggleTask(realtorId, entry.week_label, taskName, newDone);
    setProgress(updated);
  }

  function handleNotesBlur() {
    if (!progress) return;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      saveProgress(realtorId, entry.week_label, { tasks: progress.tasks, notes }).catch(() => {});
    }, 300);
  }

  const hasTasks = progress && progress.tasks.length > 0 &&
    progress.tasks.some((t) => t.done || !t.done); // has any data

  // Group by category
  const byCategory: Record<string, ProgressTask[]> = {};
  (progress?.tasks ?? []).forEach((t) => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  return (
    <div className="bg-white border border-teal-200 rounded-xl overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-teal-600">{entry.percentage}%</span>
          </div>
          <div>
            <p className="text-sm font-medium text-teal-800">{entry.week_label}</p>
            <p className="text-xs text-teal-400">
              {entry.score ?? "—"} / {entry.total_possible ?? "—"} pts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{text}</span>

          {isCurrentWeek ? (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-teal-100 text-teal-600">
              Current
            </span>
          ) : (
            <button
              onClick={handleExpand}
              className="flex items-center gap-1.5 text-xs text-teal-500 hover:text-teal-700
                         bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              {open ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Done
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded section */}
      {open && (
        <div className="px-5 pb-5 border-t border-teal-100">
          {loading ? (
            <div className="space-y-2 pt-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-7" />)}
            </div>
          ) : !hasTasks ? (
            <p className="text-xs text-teal-400 pt-4 italic">
              Detailed task data not available for this week.
            </p>
          ) : (
            <div className="pt-4 space-y-4">
              {Object.entries(byCategory).map(([cat, tasks]) => (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-2">{cat}</p>
                  <ul className="space-y-1.5">
                    {tasks.map((t) => (
                      <li
                        key={t.task}
                        onClick={() => handleToggle(t.task, t.done)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <span className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center
                                          justify-center transition-all ${
                                            t.done ? "bg-teal-600 border-teal-600"
                                                   : "border-teal-200 group-hover:border-teal-400"}`}>
                          {t.done && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className={`text-xs flex-1 ${t.done ? "text-teal-400 line-through" : "text-teal-800"}`}>
                          {t.task}
                        </span>
                        <span className="text-[10px] text-teal-300">{t.points} pts</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Notes */}
              <div className="pt-3 border-t border-teal-100">
                <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-2">Notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={3}
                  placeholder="Add a note about this week..."
                  className="w-full text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-lg
                             px-3 py-2 focus:outline-none focus:border-teal-400 focus:bg-white
                             resize-none transition-colors placeholder:text-teal-300"
                />
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-xs text-teal-500 hover:text-teal-700 transition-colors"
              >
                Done editing ↑
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [realtor,  setRealtor]  = useState<Realtor | null>(null);
  const [history,  setHistory]  = useState<ScoreHistoryEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const thisWeek = currentWeekLabel();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtors()
      .then(async (rs) => {
        const match = rs.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? rs[0] ?? null;
        setRealtor(match);
        if (match) {
          const h = await getRealtorHistory(match.id);
          setHistory(h.score_history);
        }
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const bestEntry = history.length
    ? history.reduce((b, h) => h.percentage > b.percentage ? h : b)
    : null;
  const avgScore    = avg(history.map((h) => h.percentage));
  const weeksSorted = [...history].reverse(); // newest first

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">My History</h1>
          <p className="text-sm text-teal-400 mt-1">Track your progress week by week</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Could not load history: {error}
          </div>
        )}

        {/* ── Chart section ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-teal-800 mb-4">Score Chart</h2>
          {loading ? (
            <Skeleton className="h-28" />
          ) : history.length === 0 ? (
            <p className="text-teal-400 text-sm">No history yet — your scores will appear here after your first week.</p>
          ) : (
            <>
              <HistoryChart history={history} currentWeek={thisWeek} />

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-teal-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-1">Best week</p>
                  <p className="text-sm font-bold text-teal-800">{bestEntry?.percentage ?? 0}%</p>
                  <p className="text-[10px] text-teal-400 truncate">{bestEntry?.week_label ?? "—"}</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-1">Average score</p>
                  <p className="text-sm font-bold text-teal-800">{avgScore}%</p>
                  <p className="text-[10px] text-teal-400">All time</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-teal-400 font-medium mb-1">Weeks tracked</p>
                  <p className="text-sm font-bold text-teal-800">{history.length}</p>
                  <p className="text-[10px] text-teal-400">Total</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Weekly breakdown ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-teal-800 mb-3">Weekly Breakdown</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : weeksSorted.length === 0 ? (
            <div className="bg-white border border-teal-200 rounded-xl p-8 text-center">
              <p className="text-teal-800 font-medium mb-1">No weeks logged yet</p>
              <p className="text-sm text-teal-400">Complete your first week on the dashboard to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeksSorted.map((entry) => (
                <WeekCard
                  key={entry.week_label}
                  entry={entry}
                  isCurrentWeek={entry.week_label === thisWeek}
                  realtorId={realtor?.id ?? ""}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
