"use client";

// src/app/dashboard/system/page.tsx — Build Your System

import { useEffect, useState, useId } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import {
  getRealtorByEmail, patchRoadmapItem, updateRealtor, getProgress,
  Realtor, Task,
} from "@/lib/api";

// ── Week label ─────────────────────────────────────────────────────────────────

function currentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `Week of ${fmt(mon)} \u2013 ${fmt(sun)}`;
}

// ── Methodology data ───────────────────────────────────────────────────────────

type MethodologyKey =
  | "ninja_selling"
  | "mrea"
  | "fanatical_prospecting"
  | "the_one_thing"
  | "atomic_habits"
  | "custom";

interface Methodology {
  key:         MethodologyKey;
  name:        string;
  author:      string;
  description: string;
  accent:      string;
}

const METHODOLOGIES: Methodology[] = [
  {
    key:         "ninja_selling",
    name:        "Ninja Selling",
    author:      "Larry Kendall",
    description: "Relationship-first, low-pressure system focused on flow activities \u2014 calls, notes, pop-bys. High trust, sustainable, zero chase.",
    accent:      "bg-emerald-500",
  },
  {
    key:         "mrea",
    name:        "MREA",
    author:      "Gary Keller",
    description: "Lead generation machine. Built on database, listings, and leverage. Best for agents focused on volume and systematic growth.",
    accent:      "bg-blue-500",
  },
  {
    key:         "fanatical_prospecting",
    name:        "Fanatical Prospecting",
    author:      "Jeb Blount",
    description: "High-activity, multi-channel prospecting. Phone, email, social, in-person \u2014 all at once. Built for agents who want to fill their pipeline fast.",
    accent:      "bg-orange-500",
  },
  {
    key:         "the_one_thing",
    name:        "The ONE Thing",
    author:      "Gary Keller & Jay Papasan",
    description: "Radical focus. Identify the one lead generation activity that matters most and go deep on it. Anti-multitask.",
    accent:      "bg-purple-500",
  },
  {
    key:         "atomic_habits",
    name:        "Atomic Habits",
    author:      "James Clear",
    description: "Build your business through small daily habits that compound. Identity-based: become the type of agent who does the work automatically.",
    accent:      "bg-teal-500",
  },
  {
    key:         "custom",
    name:        "Custom",
    author:      "",
    description: "Build your own system from scratch. No framework \u2014 just the habits and tasks that work for you.",
    accent:      "bg-slate-400",
  },
];

// ── Default tasks per methodology ──────────────────────────────────────────────

function makeTask(
  task: string,
  points: number,
  input_type: "yes_no" | "count",
  target?: number
): Task {
  return {
    category:   "Custom",
    task,
    points,
    type:       input_type === "count" ? "Count" : "Yes/No",
    input_type,
    enabled:    true,
    is_custom:  true,
    ...(target !== undefined ? { target, baseTarget: target } : {}),
  };
}

function defaultTasksFor(key: MethodologyKey): Task[] {
  switch (key) {
    case "ninja_selling":
      return [
        makeTask("Flow calls \u2014 reach out to people in your database", 10, "count", 10),
        makeTask("Write 3 handwritten notes or personal texts", 6, "yes_no"),
        makeTask("Pop-by a past client or sphere member", 8, "yes_no"),
        makeTask("Update CRM with new notes and contacts", 5, "yes_no"),
        makeTask("Review your Hot, Warm, Cold list", 4, "yes_no"),
      ];
    case "mrea":
      return [
        makeTask("Lead generation calls (database + new)", 10, "count", 20),
        makeTask("Listing appointments booked or held", 10, "count", 2),
        makeTask("Buyer consultations completed", 8, "count", 2),
        makeTask("Add contacts to database", 5, "count", 5),
        makeTask("Review and update lead tracker", 4, "yes_no"),
      ];
    case "fanatical_prospecting":
      return [
        makeTask("Phone prospecting calls made", 10, "count", 25),
        makeTask("LinkedIn or social media outreach messages sent", 6, "count", 10),
        makeTask("Door knocking or in-person contacts", 8, "count", 5),
        makeTask("Email prospecting sequence sent", 5, "yes_no"),
        makeTask("Referral requests made directly", 7, "count", 3),
      ];
    case "the_one_thing":
      return [
        makeTask("Lead generation focus block completed (uninterrupted)", 10, "yes_no"),
        makeTask("Primary lead gen activity reps completed", 10, "count", 15),
        makeTask("All distractions blocked during focus time", 5, "yes_no"),
        makeTask("Reviewed weekly ONE Thing goal", 4, "yes_no"),
      ];
    case "atomic_habits":
      return [
        makeTask("Morning habit stack completed (prospecting included)", 8, "yes_no"),
        makeTask("Habit tracker updated daily", 5, "yes_no"),
        makeTask("Lead generation contacts made", 10, "count", 10),
        makeTask("Environment designed for focus (phone away, desk clear)", 4, "yes_no"),
        makeTask("Reflected on identity: \u2018I am the type of agent who\u2026\u2019", 3, "yes_no"),
      ];
    case "custom":
      return [];
  }
}

// ── Methodology key helpers ────────────────────────────────────────────────────

const SEL_PREFIX = "system_sel:";

function parseSelectedMethodology(completed: Set<string>): MethodologyKey | null {
  for (const k of completed) {
    if (k.startsWith(SEL_PREFIX)) return k.slice(SEL_PREFIX.length) as MethodologyKey;
  }
  return null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 bg-[#0D5C63] text-white text-sm font-medium
                    px-5 py-3 rounded-xl shadow-lg z-50">
      {message}
    </div>
  );
}

function WarningModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Change tasks mid-week?</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          You&apos;ve already logged activity this week. Changing your task list mid-week
          may affect your current score. Your coach can see this.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200
                       rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0D5C63]
                       rounded-lg hover:bg-[#0A4A50] transition-colors"
          >
            Save anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function AddTaskRow({ onAdd }: { onAdd: (t: Task) => void }) {
  const id = useId();
  const [name,   setName]   = useState("");
  const [type,   setType]   = useState<"yes_no" | "count">("yes_no");
  const [points, setPoints] = useState(5);
  const [target, setTarget] = useState(10);

  function submit() {
    if (!name.trim()) return;
    onAdd(makeTask(name.trim(), points, type, type === "count" ? target : undefined));
    setName(""); setType("yes_no"); setPoints(5); setTarget(10);
  }

  return (
    <div className="flex flex-wrap gap-2 items-end px-4 py-3 bg-teal-50/60 border-t border-teal-100">
      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label htmlFor={`${id}-name`} className="text-xs text-slate-500">Task name</label>
        <input
          id={`${id}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Call 10 past clients"
          className="px-3 py-1.5 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none
                     focus:border-[#0D5C63] bg-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-type`} className="text-xs text-slate-500">Type</label>
        <select
          id={`${id}-type`}
          value={type}
          onChange={(e) => setType(e.target.value as "yes_no" | "count")}
          className="px-3 py-1.5 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none
                     focus:border-[#0D5C63] bg-white"
        >
          <option value="yes_no">Yes/No</option>
          <option value="count">Count</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${id}-pts`} className="text-xs text-slate-500">Points</label>
        <input
          id={`${id}-pts`}
          type="number" min={1} max={20} value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-20 px-3 py-1.5 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none
                     focus:border-[#0D5C63] bg-white"
        />
      </div>
      {type === "count" && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-tgt`} className="text-xs text-slate-500">Target</label>
          <input
            id={`${id}-tgt`}
            type="number" min={1} max={999} value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-20 px-3 py-1.5 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none
                       focus:border-[#0D5C63] bg-white"
          />
        </div>
      )}
      <button
        onClick={submit}
        className="px-4 py-1.5 text-sm font-medium text-white bg-[#0D5C63] rounded-lg
                   hover:bg-[#0A4A50] transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,   setRealtor]   = useState<Realtor | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [coachTasks, setCoachTasks] = useState<Task[]>([]);
  const [myTasks,   setMyTasks]   = useState<Task[]>([]);
  const [hours,     setHours]     = useState(10);
  const [days,      setDays]      = useState(5);
  const [saving,    setSaving]    = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);
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
      const rc = new Set(r.roadmap_completed ?? []);
      setCompleted(rc);
      setCoachTasks((r.tasks ?? []).filter((t) => !t.is_custom));
      setMyTasks((r.tasks ?? []).filter((t) => t.is_custom));
    }).finally(() => setLoading(false));
  }, [status, session, router]);

  // ── Methodology selection ────────────────────────────────────────────────────

  async function selectMethodology(key: MethodologyKey) {
    if (!realtor) return;
    const prev = parseSelectedMethodology(completed);
    if (prev === key) return;

    setCompleted((c) => {
      const next = new Set(c);
      if (prev) next.delete(`${SEL_PREFIX}${prev}`);
      next.add(`${SEL_PREFIX}${key}`);
      return next;
    });

    try {
      if (prev) await patchRoadmapItem(realtor.id, `${SEL_PREFIX}${prev}`, false);
      const updated = await patchRoadmapItem(realtor.id, `${SEL_PREFIX}${key}`, true);
      setCompleted(new Set(updated));
    } catch {
      setCompleted((c) => {
        const next = new Set(c);
        next.delete(`${SEL_PREFIX}${key}`);
        if (prev) next.add(`${SEL_PREFIX}${prev}`);
        return next;
      });
    }

    if (myTasks.length === 0) setMyTasks(defaultTasksFor(key));
  }

  // ── Task list management ─────────────────────────────────────────────────────

  function addTask(t: Task)         { setMyTasks((p) => [...p, t]); }
  function removeTask(i: number)    { setMyTasks((p) => p.filter((_, idx) => idx !== i)); }
  function moveTask(i: number, d: -1 | 1) {
    setMyTasks((p) => {
      const n = [...p], j = i + d;
      if (j < 0 || j >= n.length) return p;
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function attemptSave() {
    if (!realtor) return;
    setSaving(true);
    try {
      const progress = await getProgress(realtor.id, currentWeekLabel()).catch(() => null);
      const score = (progress as { score?: number } | null)?.score ?? 0;
      if (score > 0) { setShowModal(true); setSaving(false); return; }
      await doSave();
    } catch {
      await doSave();
    }
  }

  async function doSave() {
    if (!realtor) return;
    setSaving(true);
    try {
      await updateRealtor(realtor.id, { tasks: [...coachTasks, ...myTasks] });
      setToast("System saved!");
    } catch {
      setToast("Save failed. Try again.");
    } finally {
      setSaving(false);
      setShowModal(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F0FAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const selectedKey = parseSelectedMethodology(completed);
  const minsPerDay  = days > 0 ? Math.round((hours * 60) / days) : 0;
  const hoursPerDay = days > 0 ? (hours / days).toFixed(1) : "0";

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Build Your System</h1>
            <p className="text-sm text-[#0A4A50] mt-1">Design the weekly routine that moves your business forward.</p>
          </div>

          {/* ── Section A: Coach Tasks ─────────────────────────────────────── */}
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Coach-Set Tasks
          </h2>

          {coachTasks.length === 0 ? (
            <div className="bg-white border border-[#B2DFDB] rounded-xl px-5 py-4 mb-8">
              <p className="text-sm text-slate-500">No tasks have been set by your coach yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-teal-100">
                    <th className="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Task</th>
                    <th className="text-left px-3 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Type</th>
                    <th className="text-right px-5 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-50">
                  {coachTasks.map((t, i) => (
                    <tr key={i} className="text-slate-600">
                      <td className="px-5 py-3">{t.task}</td>
                      <td className="px-3 py-3">
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          {t.input_type === "count" ? "Count" : "Yes/No"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-[#0D5C63]">{t.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-slate-400 px-5 py-2.5 border-t border-teal-50">
                These tasks are set by your coach and cannot be edited here.
              </p>
            </div>
          )}

          {/* ── Section B divider ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Build Your Own System
            </h2>
            <div className="flex-1 h-px bg-teal-200" />
          </div>

          {/* Step 1 — Methodology ─────────────────────────────────────────── */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#0D5C63] mb-1">Step 1 — Choose Your Methodology</h3>
            <p className="text-xs text-slate-500 mb-4">Pick the framework that resonates with how you want to work.</p>
            <div className="grid grid-cols-2 gap-3">
              {METHODOLOGIES.map((m) => {
                const sel = selectedKey === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => selectMethodology(m.key)}
                    className={`text-left p-4 rounded-xl border transition-all
                                ${sel
                                  ? "border-[#0D5C63] bg-teal-50 ring-2 ring-[#0D5C63]/20"
                                  : "border-[#B2DFDB] bg-white hover:border-[#0D5C63]"}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.accent}`} />
                        <span className="font-semibold text-sm text-[#0D5C63]">{m.name}</span>
                      </div>
                      {sel && (
                        <span className="shrink-0 w-5 h-5 rounded-full bg-[#0D5C63] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2"
                                  strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    {m.author && <p className="text-xs text-slate-400 mb-1.5 italic">{m.author}</p>}
                    <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Weekly commitment ───────────────────────────────────── */}
          {selectedKey && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#0D5C63] mb-1">Step 2 — Set Your Weekly Commitment</h3>
              <p className="text-xs text-slate-500 mb-4">How much focused time will you dedicate to lead generation each week?</p>
              <div className="bg-white border border-[#B2DFDB] rounded-xl p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Hours per week dedicated to lead generation</label>
                    <input
                      type="number" min={1} max={40} value={hours}
                      onChange={(e) => setHours(Math.max(1, Math.min(40, Number(e.target.value))))}
                      className="px-3 py-2 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none focus:border-[#0D5C63]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Days per week you&apos;ll prospect</label>
                    <input
                      type="number" min={1} max={7} value={days}
                      onChange={(e) => setDays(Math.max(1, Math.min(7, Number(e.target.value))))}
                      className="px-3 py-2 text-sm border border-[#B2DFDB] rounded-lg focus:outline-none focus:border-[#0D5C63]"
                    />
                  </div>
                </div>
                <div className="bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
                  <p className="text-sm text-[#0D5C63]">
                    That&apos;s <span className="font-semibold">{hoursPerDay} hours</span> per prospecting day
                    &mdash; <span className="font-semibold">{minsPerDay} minutes</span> of focused lead generation daily.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Task list ───────────────────────────────────────────── */}
          {selectedKey && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[#0D5C63] mb-1">Step 3 — Build Your Weekly Tasks</h3>
              <p className="text-xs text-slate-500 mb-4">
                Edit the suggested tasks below, or build from scratch. These become your weekly scorecard.
              </p>

              <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden">
                {myTasks.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <p className="text-sm text-slate-400 mb-1">No custom tasks yet.</p>
                    <p className="text-xs text-slate-400">Add tasks below to build your weekly system.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-teal-50">
                    {myTasks.map((t, i) => (
                      <li key={i} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveTask(i, -1)}
                            disabled={i === 0}
                            aria-label="Move up"
                            className="w-6 h-5 flex items-center justify-center text-slate-300
                                       hover:text-slate-500 disabled:opacity-20 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none">
                              <path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => moveTask(i, 1)}
                            disabled={i === myTasks.length - 1}
                            aria-label="Move down"
                            className="w-6 h-5 flex items-center justify-center text-slate-300
                                       hover:text-slate-500 disabled:opacity-20 transition-colors"
                          >
                            <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none">
                              <path d="M1 2l5 5 5-5" stroke="currentColor" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>

                        <span className="flex-1 text-sm text-slate-700">{t.task}</span>

                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          {t.input_type === "count" ? "Count" : "Yes/No"}
                        </span>
                        {t.input_type === "count" && t.target !== undefined && (
                          <span className="text-xs text-slate-400">&times;{t.target}</span>
                        )}
                        <span className="text-xs font-semibold text-[#0D5C63] w-10 text-right">
                          {t.points}pt
                        </span>

                        <button
                          onClick={() => removeTask(i)}
                          aria-label="Remove task"
                          className="w-6 h-6 flex items-center justify-center text-slate-300
                                     hover:text-red-400 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5"
                                  strokeLinecap="round"/>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <AddTaskRow onAdd={addTask} />
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={attemptSave}
                  disabled={saving}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0D5C63]
                             rounded-xl hover:bg-[#0A4A50] disabled:opacity-60 transition-colors"
                >
                  {saving ? "Saving\u2026" : "Save My System"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {showModal && (
        <WarningModal
          onConfirm={doSave}
          onCancel={() => { setShowModal(false); setSaving(false); }}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
