"use client";

// src/app/dashboard/week/page.tsx — My Week (standalone)

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getRealtorByEmail, getProgress, patchTask,
  Realtor, WeekProgress, ProgressTask,
} from "@/lib/api";

// ── Week label ─────────────────────────────────────────────────────────────────

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

// ── Presets (same as system/page.tsx) ─────────────────────────────────────────

import type { Task } from "@/lib/api";

type PresetTask = Task & { baseTarget?: number };

function pt(
  category: string,
  task: string,
  type: "checkbox" | "count",
  points: number,
  baseTarget?: number
): PresetTask {
  return {
    category, task, type, input_type: type, points,
    enabled: true, is_custom: true,
    ...(baseTarget !== undefined ? { baseTarget, target: baseTarget } : {}),
  };
}

const PRESETS: Record<string, { tasks: PresetTask[] }> = {
  "Ninja Selling": {
    tasks: [
      pt("Prospecting",     "Live interviews / prospecting calls",           "count",    12, 50),
      pt("Prospecting",     "Send personal notes or texts",                  "count",    8,  10),
      pt("Prospecting",     "Live real estate reviews",                      "count",    6,  2),
      pt("Prospecting",     "Add new contacts to CRM",                       "count",    5,  3),
      pt("Prospecting",     "Request referrals",                             "count",    5,  3),
      pt("Follow-Up",       "Warm calls to sphere (customer service calls)", "count",    10, 10),
      pt("Follow-Up",       "Follow up with all active clients",             "checkbox", 8),
      pt("Follow-Up",       "Touch leads in CRM",                            "count",    6,  10),
      pt("Follow-Up",       "Update all CRM notes",                          "checkbox", 5),
      pt("Listings/Buyers", "Listing appointment held or scheduled",         "count",    8,  1),
      pt("Listings/Buyers", "Buyer consultation completed",                  "count",    7,  1),
      pt("Listings/Buyers", "Send market update to clients",                 "count",    5,  5),
      pt("Education",       "30+ min reading / training",                    "checkbox", 5),
      pt("Education",       "Review coaching notes",                         "checkbox", 5),
      pt("Education",       "Time block lead gen hour",                      "checkbox", 5),
    ],
  },
  "KW / MREA": {
    tasks: [
      pt("Prospecting",     "Prospecting calls",                          "count",    10, 20),
      pt("Prospecting",     "Warm calls to sphere",                       "count",    7,  10),
      pt("Prospecting",     "Add contacts to CRM",                        "count",    5,  5),
      pt("Prospecting",     "Request referrals",                          "count",    5,  3),
      pt("Prospecting",     "Door knock or attend event",                 "checkbox", 4),
      pt("Follow-Up",       "Follow up with active clients",              "checkbox", 10),
      pt("Follow-Up",       "Touch leads in CRM (8x8 / 33 Touch)",        "count",    7,  10),
      pt("Follow-Up",       "Update CRM notes",                           "checkbox", 5),
      pt("Listings/Buyers", "Listing appointment held or scheduled",      "count",    8,  2),
      pt("Listings/Buyers", "Buyer consultation completed",               "count",    7,  1),
      pt("Listings/Buyers", "Review new MLS listings",                    "count",    4,  10),
      pt("Listings/Buyers", "Send market update",                         "count",    4,  5),
      pt("Social/Brand",    "Post on social media",                       "count",    4,  3),
      pt("Social/Brand",    "Request Google/Zillow review",               "count",    4,  1),
      pt("Education",       "Time block 3hr lead gen daily (5x/week)",    "checkbox", 6),
      pt("Education",       "30+ min training",                           "checkbox", 6),
      pt("Education",       "Review coaching notes",                      "checkbox", 4),
    ],
  },
  "Ryan Serhant": {
    tasks: [
      pt("Prospecting",     "Prospecting calls",                          "count",    12, 30),
      pt("Prospecting",     "Expand sphere — new contacts added",         "count",    7,  5),
      pt("Prospecting",     "Door knock or attend community event",       "checkbox", 5),
      pt("Prospecting",     "Request reviews (Google/Zillow)",            "count",    5,  2),
      pt("Follow-Up",       "Follow up with all active clients",          "checkbox", 12),
      pt("Follow-Up",       "Touch leads in CRM",                         "count",    10, 15),
      pt("Listings/Buyers", "Listing appointment held or scheduled",      "count",    8,  2),
      pt("Listings/Buyers", "Buyer consultation completed",               "count",    7,  1),
      pt("Social/Brand",    "Post on social media",                       "count",    10, 7),
      pt("Social/Brand",    "Publish video content",                      "count",    9,  3),
      pt("Social/Brand",    "Share educational real estate content",      "count",    5,  3),
      pt("Education",       "30+ min training / reading",                 "checkbox", 5),
      pt("Education",       "Time block lead gen hour",                   "checkbox", 5),
    ],
  },
  "Tom Ferry": {
    tasks: [
      pt("Prospecting",     "Prospecting calls",                          "count",    8,  25),
      pt("Prospecting",     "Warm calls to sphere",                       "count",    7,  10),
      pt("Prospecting",     "Add contacts to CRM",                        "count",    5,  5),
      pt("Prospecting",     "Door knock or attend event",                 "checkbox", 4),
      pt("Prospecting",     "Request reviews",                            "count",    4,  2),
      pt("Follow-Up",       "Follow up with active clients",              "checkbox", 8),
      pt("Follow-Up",       "Touch leads in CRM",                         "count",    7,  15),
      pt("Follow-Up",       "Update CRM notes",                           "checkbox", 4),
      pt("Listings/Buyers", "Listing appointment held or scheduled",      "count",    8,  2),
      pt("Listings/Buyers", "Buyer consultation completed",               "count",    7,  2),
      pt("Listings/Buyers", "Send market update",                         "count",    4,  5),
      pt("Social/Brand",    "Post on social media",                       "count",    5,  5),
      pt("Social/Brand",    "Publish video content",                      "count",    6,  2),
      pt("Social/Brand",    "Share educational content",                  "count",    4,  2),
      pt("Education",       "Daily role-play / scripts practice",         "checkbox", 5),
      pt("Education",       "30+ min training",                           "checkbox", 5),
      pt("Education",       "Review coaching notes",                      "checkbox", 4),
      pt("Education",       "Time block lead gen hour",                   "checkbox", 5),
    ],
  },
  "Buffini Referral": {
    tasks: [
      pt("Prospecting",     "Warm calls to sphere / past clients",        "count",    15, 10),
      pt("Prospecting",     "Request referrals",                          "count",    15, 5),
      pt("Prospecting",     "Send personal notes",                        "count",    12, 5),
      pt("Prospecting",     "Pop-by / in-person client visit",            "count",    8,  2),
      pt("Follow-Up",       "Follow up with active clients",              "checkbox", 13),
      pt("Follow-Up",       "Touch leads in CRM",                         "count",    9,  8),
      pt("Follow-Up",       "Monthly mailer / newsletter sent",           "checkbox", 8),
      pt("Listings/Buyers", "Send market update to clients",              "count",    5,  5),
      pt("Social/Brand",    "Request Google/Zillow review",               "count",    5,  2),
      pt("Education",       "30+ min reading / training",                 "checkbox", 5),
      pt("Education",       "Review coaching notes",                      "checkbox", 5),
    ],
  },
  "The ONE Thing": {
    tasks: [
      pt("Prospecting",     "Prospecting calls (lead gen hour)",          "count",    15, 15),
      pt("Prospecting",     "Add contacts to CRM",                        "count",    7,  3),
      pt("Prospecting",     "Touch leads in CRM",                         "count",    10, 10),
      pt("Follow-Up",       "Follow up with active clients",              "checkbox", 12),
      pt("Listings/Buyers", "Listing appointment held or scheduled",      "count",    14, 1),
      pt("Listings/Buyers", "Buyer consultation completed",               "count",    12, 1),
      pt("Education",       "Identify single MIT (most important task)",  "checkbox", 12),
      pt("Education",       "Time block lead gen hour (no interruptions)","checkbox", 14),
      pt("Education",       "30+ min reading / training",                 "checkbox", 4),
    ],
  },
  "BOLD / KW MAPS": {
    tasks: [
      pt("Prospecting",     "Prospecting calls",                          "count",    10, 20),
      pt("Prospecting",     "Warm calls to sphere",                       "count",    7,  10),
      pt("Prospecting",     "Add contacts to CRM",                        "count",    5,  5),
      pt("Prospecting",     "Request referrals",                          "count",    5,  3),
      pt("Prospecting",     "Door knock or attend event",                 "checkbox", 4),
      pt("Follow-Up",       "Follow up with active clients",              "checkbox", 10),
      pt("Follow-Up",       "Touch leads in CRM",                         "count",    7,  15),
      pt("Follow-Up",       "Update CRM notes",                           "checkbox", 4),
      pt("Listings/Buyers", "Listing appointment held or scheduled",      "count",    8,  2),
      pt("Listings/Buyers", "Buyer consultation completed",               "count",    7,  2),
      pt("Social/Brand",    "Post on social media",                       "count",    5,  3),
      pt("Social/Brand",    "Request reviews",                            "count",    4,  2),
      pt("Education",       "Daily role-play / scripts practice",         "checkbox", 9),
      pt("Education",       "30+ min training",                           "checkbox", 5),
      pt("Education",       "Time block lead gen hour",                   "checkbox", 6),
      pt("Education",       "Review coaching notes",                      "checkbox", 4),
    ],
  },
};

function getPresetTasks(systemName: string, hours: number): Task[] {
  const preset = PRESETS[systemName];
  if (!preset) return [];
  return preset.tasks.map((t) => ({
    ...t,
    target: (t.type === "count" && t.baseTarget)
      ? Math.max(1, Math.round(t.baseTarget * (hours / 40)))
      : t.target,
  })) as Task[];
}

function parseSystemConfig(completed: string[]): { system: string | null; hours: number } {
  const SEL = "system_sel:";
  const HRS = "system_hrs:";
  let system: string | null = null;
  let hours = 30;
  for (const k of completed) {
    if (k.startsWith(SEL)) system = decodeURIComponent(k.slice(SEL.length));
    if (k.startsWith(HRS)) hours = Number(k.slice(HRS.length)) || 30;
  }
  return { system, hours };
}

// ── Week table helpers ─────────────────────────────────────────────────────────

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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

// ── My Week table ──────────────────────────────────────────────────────────────

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
  const [saving,     setSaving]     = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showFlash() {
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 2000);
  }

  async function handleCountChange(task: ProgressTask, fullDay: string, raw: string) {
    const value = Math.max(0, parseInt(raw) || 0);
    setSaving(task.task);

    onUpdate({
      ...progress,
      tasks: progress.tasks.map((t) => {
        if (t.task !== task.task) return t;
        const dc     = { ...(t.daily_counts ?? {}), [fullDay]: value };
        const total  = Object.values(dc).reduce((a, b) => a + b, 0);
        const target = t.target ?? 1;
        const done   = total >= target;
        const ep     = Math.round(Math.min(total / target, 1.0) * t.points * 10) / 10;
        return { ...t, daily_counts: dc, weekly_total: total, done, earned_points: ep };
      }),
    });

    try {
      const updated = await patchTask(realtorId, weekLabel, {
        task: task.task, action: "set_count", day: fullDay, value,
      });
      onUpdate(updated);
      showFlash();
    } catch {
      onUpdate(progress);
    } finally {
      setSaving(null);
    }
  }

  async function handleYesNoToggle(task: ProgressTask) {
    setSaving(task.task);

    onUpdate({
      ...progress,
      tasks: progress.tasks.map((t) =>
        t.task !== task.task ? t : { ...t, done: !t.done, earned_points: !t.done ? t.points : 0 }
      ),
    });

    try {
      const updated = await patchTask(realtorId, weekLabel, {
        task: task.task, action: "toggle_yes_no",
      });
      onUpdate(updated);
      showFlash();
    } catch {
      onUpdate(progress);
    } finally {
      setSaving(null);
    }
  }

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
                <tr className="bg-teal-100">
                  <td colSpan={10} className="px-4 py-1.5 text-[11px] font-medium text-teal-700 uppercase tracking-wider">
                    {cat}
                  </td>
                </tr>

                {tasks.map((t, rowIdx) => {
                  const isCount  = t.input_type === "count";
                  const ep       = earnedPoints(t);
                  const target   = t.target ?? 1;
                  const total    = t.weekly_total ?? 0;
                  const isSaving = saving === t.task;

                  const ptsCls = t.done
                    ? "text-green-600"
                    : ep > 0
                    ? "text-teal-500"
                    : "text-gray-400";

                  return (
                    <tr key={t.task} className={rowIdx % 2 === 0 ? "bg-white" : "bg-teal-50"}>
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

                      <td className="text-center px-1 py-2">
                        {isCount ? (
                          <span className={`text-[12px] font-medium ${total >= target ? "text-teal-800" : "text-teal-500"}`}>
                            {total}/{target}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[11px]">—</span>
                        )}
                      </td>

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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyWeekPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,  setRealtor]  = useState<Realtor | null>(null);
  const [progress, setProgress] = useState<WeekProgress | null>(null);
  const [loading,  setLoading]  = useState(true);

  const weekLabel = currentWeekLabel();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email)
      .then(async (match) => {
        if (!match) { router.push("/"); return; }
        setRealtor(match);
        const prog = await getProgress(match.id, weekLabel);
        setProgress(prog);
      })
      .finally(() => setLoading(false));
  }, [status, session, weekLabel, router]);

  const handleProgressUpdate = useCallback((updated: WeekProgress) => {
    setProgress(updated);
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen bg-[#F0FAFA] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }
  if (status === "unauthenticated") return null;

  // ── Resolve task source ──────────────────────────────────────────────────────

  const hasTasks = realtor?.tasks && realtor.tasks.length > 0;

  // Check for system_config in roadmap_completed
  const { system: selectedSystem, hours: systemHours } = parseSystemConfig(
    realtor?.roadmap_completed ?? []
  );
  const presetTasks = selectedSystem ? getPresetTasks(selectedSystem, systemHours) : null;

  // The effective tasks for My Week:
  // 1. Coach-set tasks (realtor.tasks non-empty) → use those (API handles it via progress.tasks)
  // 2. System preset → inject into progress if progress exists but has no tasks
  // 3. Neither → show banner

  const showBanner  = !hasTasks && !presetTasks;
  const effectiveProg: WeekProgress | null = (() => {
    if (!progress) return null;
    if (progress.tasks.length > 0) return progress;
    if (presetTasks && presetTasks.length > 0) {
      // Inject preset tasks as ProgressTask shape (no saved state yet)
      return {
        ...progress,
        tasks: presetTasks.map((t) => ({
          ...t,
          done:         false,
          earned_points: 0,
          weekly_total:  0,
          daily_counts:  {},
        })) as ProgressTask[],
      };
    }
    return progress;
  })();

  return (
    <div className="flex bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8">

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">My Week</h1>
          <p className="text-sm text-[#0A4A50] mt-1">{weekLabel}</p>
        </div>

        {showBanner ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg leading-none mt-0.5">⚠</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                You haven&apos;t set up your weekly system yet.
              </p>
              <p className="text-sm text-amber-700 mt-0.5">
                Choose a system to generate your weekly task list.{" "}
                <Link href="/dashboard/system" className="font-medium underline hover:text-amber-900">
                  Go to Finding My System →
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-teal-800">Weekly Strategy</h2>
                <p className="text-[11px] text-teal-400 mt-0.5">
                  Enter daily counts for count tasks. Toggle yes/no tasks when complete.
                </p>
              </div>
              {effectiveProg && (
                <span className="text-xs text-teal-500 font-medium">
                  {Math.round(effectiveProg.score ?? 0)} / {effectiveProg.total_possible ?? 0} pts
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : !effectiveProg || effectiveProg.tasks.length === 0 ? (
              <p className="text-teal-400 text-sm">No tasks configured yet.</p>
            ) : (
              <MyWeekTable
                progress={effectiveProg}
                realtorId={realtor?.id ?? ""}
                weekLabel={weekLabel}
                onUpdate={handleProgressUpdate}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}
