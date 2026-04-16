"use client";

// src/app/dashboard/system/page.tsx — Finding My System (task editor)

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { getRealtorByEmail, updateRealtor, getProgress, Realtor, Task } from "@/lib/api";

// ── Week label (matches dashboard) ─────────────────────────────────────────────

function currentWeekLabel(): string {
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0D5C63] text-white
                    text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
      {message}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function WarningModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
        <h2 className="text-base font-semibold text-[#0D5C63] mb-2">You have activity this week</h2>
        <p className="text-sm text-teal-700 leading-relaxed mb-5">
          Changing your task list mid-week will reset your current week&apos;s progress.
          Your score history for past weeks is safe. Do you want to continue?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-teal-200 text-sm text-teal-600
                       hover:bg-teal-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[#0D5C63] text-sm text-white font-medium
                       hover:bg-teal-700 transition-colors"
          >
            Yes, update my system
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Task Form ──────────────────────────────────────────────────────────────

interface NewTaskDraft {
  task:      string;
  type:      "yes_no" | "count";
  points:    number;
  target:    number;
}

const EMPTY_DRAFT: NewTaskDraft = { task: "", type: "yes_no", points: 5, target: 5 };

function AddTaskRow({
  onAdd,
  onCancel,
}: {
  onAdd:    (t: NewTaskDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<NewTaskDraft>(EMPTY_DRAFT);

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border-t border-[#B2DFDB]">
      <input
        type="text"
        placeholder="Task name"
        value={draft.task}
        onChange={(e) => setDraft({ ...draft, task: e.target.value })}
        className="flex-1 text-sm border border-[#B2DFDB] rounded-lg px-3 py-1.5 focus:outline-none
                   focus:border-[#0D5C63] bg-white text-teal-800 placeholder:text-teal-300 min-w-0"
      />
      <select
        value={draft.type}
        onChange={(e) => setDraft({ ...draft, type: e.target.value as "yes_no" | "count" })}
        className="text-sm border border-[#B2DFDB] rounded-lg px-2 py-1.5 focus:outline-none
                   focus:border-[#0D5C63] bg-white text-teal-800"
      >
        <option value="yes_no">Yes / No</option>
        <option value="count">Count</option>
      </select>
      <input
        type="number"
        min={1}
        max={100}
        value={draft.points}
        onChange={(e) => setDraft({ ...draft, points: Math.max(1, parseInt(e.target.value) || 1) })}
        className="w-16 text-sm border border-[#B2DFDB] rounded-lg px-2 py-1.5 focus:outline-none
                   focus:border-[#0D5C63] bg-white text-teal-800 text-center"
        title="Points"
      />
      {draft.type === "count" && (
        <input
          type="number"
          min={1}
          value={draft.target}
          onChange={(e) => setDraft({ ...draft, target: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-16 text-sm border border-[#B2DFDB] rounded-lg px-2 py-1.5 focus:outline-none
                     focus:border-[#0D5C63] bg-white text-teal-800 text-center"
          title="Target"
        />
      )}
      <button
        onClick={() => { if (draft.task.trim()) onAdd(draft); }}
        disabled={!draft.task.trim()}
        className="px-3 py-1.5 rounded-lg bg-[#0D5C63] text-white text-sm font-medium
                   hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
      >
        Add
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1.5 rounded-lg border border-teal-200 text-sm text-teal-500
                   hover:bg-white transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,     setRealtor]     = useState<Realtor | null>(null);
  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email).then((r) => {
      if (!r) { router.push("/"); return; }
      setRealtor(r);
      setTasks(r.tasks ?? []);
    }).finally(() => setLoading(false));
  }, [status, session, router]);

  const moveTask = useCallback((idx: number, dir: -1 | 1) => {
    setTasks((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const deleteTask = useCallback((idx: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addTask = useCallback((draft: NewTaskDraft) => {
    const newTask: Task = {
      category:   "Custom",
      task:       draft.task.trim(),
      points:     draft.points,
      type:       draft.type,
      input_type: draft.type === "count" ? "count" : "yes_no",
      enabled:    true,
      is_custom:  true,
      ...(draft.type === "count" ? { target: draft.target } : {}),
    };
    setTasks((prev) => [...prev, newTask]);
    setShowAdd(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!realtor) return;
    setSaving(true);
    try {
      // Check for mid-week activity
      const weekLabel = currentWeekLabel();
      let hasActivity = false;
      try {
        const prog = await getProgress(realtor.id, weekLabel);
        hasActivity = prog.score > 0;
      } catch {
        // No progress record yet — safe to save
      }

      if (hasActivity) {
        setSaving(false);
        setShowModal(true);
        return;
      }
      await doSave();
    } catch {
      setSaving(false);
      setToast("Failed to save. Please try again.");
    }
  }, [realtor, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSave = useCallback(async () => {
    if (!realtor) return;
    setSaving(true);
    setShowModal(false);
    try {
      await updateRealtor(realtor.id, { tasks });
      setToast("System saved! Your tasks will appear in My Week.");
    } catch {
      setToast("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [realtor, tasks]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F0FAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const customTasks    = tasks.filter((t) => t.is_custom);
  const nonCustomTasks = tasks.filter((t) => !t.is_custom);

  return (
    <div className="flex min-h-screen bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      {showModal && (
        <WarningModal
          onCancel={() => setShowModal(false)}
          onConfirm={doSave}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl">

          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#0D5C63]">Finding My System</h1>
            <p className="text-sm text-teal-500 mt-1">
              Build the weekly habits that will drive your business. What you track, you improve.
            </p>
          </div>

          {/* Existing tasks set by coach */}
          {nonCustomTasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider mb-2">
                Tasks set by your coach
              </h2>
              <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-teal-50 border-b border-[#B2DFDB]">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Task</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Type</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-50">
                    {nonCustomTasks.map((t, i) => (
                      <tr key={i} className="opacity-60">
                        <td className="px-4 py-2.5 text-teal-800">{t.task}</td>
                        <td className="px-3 py-2.5 text-center text-teal-500 capitalize text-xs">
                          {t.input_type ?? t.type}
                        </td>
                        <td className="px-3 py-2.5 text-center text-teal-500">{t.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-teal-400 mt-1.5">Coach-set tasks can't be edited here.</p>
            </div>
          )}

          {/* Custom tasks */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">
                My custom tasks
              </h2>
              {!showAdd && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-xs font-medium text-[#0D5C63] border border-[#0D5C63] px-3 py-1.5
                             rounded-lg hover:bg-[#0D5C63] hover:text-white transition-colors"
                >
                  + Add Task
                </button>
              )}
            </div>

            <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden">
              {customTasks.length === 0 && !showAdd ? (
                <div className="px-5 py-8 text-center text-sm text-teal-400">
                  No custom tasks yet. Add one to get started.
                </div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-teal-50 border-b border-[#B2DFDB]">
                        <th className="w-16 px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider text-center">Order</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Task</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Type</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Pts</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#0D5C63] uppercase tracking-wider">Target</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-50">
                      {tasks.map((t, globalIdx) => {
                        if (!t.is_custom) return null;
                        // Index within full tasks array for move operations
                        return (
                          <tr key={globalIdx} className="hover:bg-teal-50/50 transition-colors">
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col items-center gap-0.5">
                                <button
                                  onClick={() => moveTask(globalIdx, -1)}
                                  disabled={globalIdx === 0}
                                  className="text-teal-300 hover:text-[#0D5C63] disabled:opacity-20 text-xs leading-none"
                                  title="Move up"
                                >▲</button>
                                <button
                                  onClick={() => moveTask(globalIdx, 1)}
                                  disabled={globalIdx === tasks.length - 1}
                                  className="text-teal-300 hover:text-[#0D5C63] disabled:opacity-20 text-xs leading-none"
                                  title="Move down"
                                >▼</button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-teal-800 font-medium">{t.task}</td>
                            <td className="px-3 py-2.5 text-center text-teal-500 capitalize text-xs">
                              {t.input_type ?? t.type}
                            </td>
                            <td className="px-3 py-2.5 text-center text-teal-500">{t.points}</td>
                            <td className="px-3 py-2.5 text-center text-teal-400 text-xs">
                              {t.type === "count" ? (t.target ?? "—") : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => deleteTask(globalIdx)}
                                className="text-teal-300 hover:text-red-400 transition-colors text-sm"
                                title="Remove task"
                              >✕</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {showAdd && (
                    <AddTaskRow
                      onAdd={addTask}
                      onCancel={() => setShowAdd(false)}
                    />
                  )}
                </>
              )}

              {customTasks.length === 0 && showAdd && (
                <AddTaskRow
                  onAdd={addTask}
                  onCancel={() => setShowAdd(false)}
                />
              )}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#0D5C63] text-white text-sm font-semibold
                       hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save My System"}
          </button>

        </div>
      </main>
    </div>
  );
}
