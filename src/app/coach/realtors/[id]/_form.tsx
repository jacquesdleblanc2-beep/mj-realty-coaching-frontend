"use client";

// Shared strategy form used by both the detail page and setup page.

import { useState } from "react";
import { Realtor, Task, YearlyGoals, updateRealtor } from "@/lib/api";

// ── Default task list (mirrors config.py COACHING_CHECKLIST) ──────────────────

export const DEFAULT_TASKS: Task[] = [
  { category: "Prospecting",     task: "Made 10+ prospecting calls",                points: 8, type: "checkbox", enabled: true, is_custom: false },
  { category: "Prospecting",     task: "Sent 5+ handwritten notes or personal texts",points: 7, type: "checkbox", enabled: true, is_custom: false },
  { category: "Prospecting",     task: "Added 3+ new contacts to CRM",               points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Prospecting",     task: "Requested 3+ referrals",                     points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Prospecting",     task: "Door-knocked or attended 1 community event", points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Listings/Buyers", task: "Held or scheduled 1+ listing appointment",  points: 8, type: "checkbox", enabled: true, is_custom: false },
  { category: "Listings/Buyers", task: "Completed 1+ buyer consultation",            points: 7, type: "checkbox", enabled: true, is_custom: false },
  { category: "Listings/Buyers", task: "Reviewed 10+ new MLS listings",              points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Listings/Buyers", task: "Sent market update to 5+ clients",           points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Follow-Up",       task: "Followed up with all active buyers/sellers", points: 8, type: "checkbox", enabled: true, is_custom: false },
  { category: "Follow-Up",       task: "Touched 10+ leads in CRM (call/text/email)", points: 7, type: "checkbox", enabled: true, is_custom: false },
  { category: "Follow-Up",       task: "Updated all CRM notes from the week",        points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Social/Brand",    task: "Posted 3+ times on social media",            points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Social/Brand",    task: "Shared 1+ educational real estate content",  points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Social/Brand",    task: "Requested 1+ Google/Zillow review",          points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Education",       task: "Spent 30+ min on training/education",        points: 5, type: "checkbox", enabled: true, is_custom: false },
  { category: "Education",       task: "Reviewed last week's coaching notes",        points: 5, type: "checkbox", enabled: true, is_custom: false },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function Card({ title, children, noMargin }: { title: string; children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div className={`bg-white border border-teal-200 rounded-xl p-6 ${noMargin ? "" : "mb-6"}`}>
      <h2 className="text-sm font-semibold text-teal-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-teal-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white border border-teal-200 focus:border-teal-400 rounded-xl " +
                 "px-4 py-2.5 text-sm text-teal-800 focus:outline-none transition-colors placeholder:text-teal-300";

const textareaCls = inputCls + " resize-none";

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex w-8 h-4 rounded-full transition-colors shrink-0
                  ${checked ? "bg-teal-500" : "bg-teal-200"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform
                        ${checked ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ── Main form component ───────────────────────────────────────────────────────

interface StrategyFormProps {
  realtor:       Realtor;
  saveLabel?:    string;
  onSaveSuccess: () => void;
}

function autoDetectTasks(tasks: Task[]): Task[] {
  return tasks.map((t) => {
    if (t.type === "count") return t; // already numeric, leave alone
    const match = t.task.match(/(\d+)\+?/);
    if (match) {
      return { ...t, type: "count", input_type: "count", target: Number(match[1]) };
    }
    return t;
  });
}

const CATEGORIES = ["Prospecting", "Listings/Buyers", "Follow-Up", "Social/Brand", "Education", "Custom"] as const;

export function StrategyForm({ realtor, saveLabel = "Save Changes", onSaveSuccess }: StrategyFormProps) {
  const initTasks = autoDetectTasks(realtor.tasks?.length ? realtor.tasks : DEFAULT_TASKS);

  const [focus,       setFocus]       = useState(realtor.coaching_focus ?? "");
  const [goals,       setGoals]       = useState(realtor.martin_goals   ?? "");
  const [priorities,  setPriorities]  = useState(realtor.priorities     ?? "");
  const [yearlyGoals, setYearlyGoals] = useState<YearlyGoals>({
    conservative_gci: realtor.yearly_goals?.conservative_gci ?? 0,
    stretch_gci:      realtor.yearly_goals?.stretch_gci      ?? 0,
    total_deals:      realtor.yearly_goals?.total_deals       ?? 0,
    buyer_deals:      realtor.yearly_goals?.buyer_deals       ?? 0,
    seller_deals:     realtor.yearly_goals?.seller_deals      ?? 0,
  });
  const [currentGci,    setCurrentGci]    = useState(realtor.current_gci ?? 0);
  const [tasks,         setTasks]         = useState<Task[]>(initTasks);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState("");
  const [saved,         setSaved]         = useState(false);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newCategory,   setNewCategory]   = useState<string>("Custom");
  const [newTaskName,   setNewTaskName]   = useState("");
  const [newTaskType,   setNewTaskType]   = useState<"checkbox" | "count">("checkbox");
  const [newTaskTarget, setNewTaskTarget] = useState(1);
  const [newTaskPoints, setNewTaskPoints] = useState(5);

  function updateTask(i: number, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }

  function addCustomTask() {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      category: newCategory, task: newTaskName.trim(), points: newTaskPoints,
      type: newTaskType, input_type: newTaskType, enabled: true, is_custom: true,
      ...(newTaskType === "count" ? { target: newTaskTarget } : {}),
    };
    // Insert after the last task in the same category, or at end
    setTasks((prev) => {
      const lastIdx = prev.map((t, i) => t.category === newCategory ? i : -1).filter(i => i >= 0).at(-1);
      if (lastIdx === undefined) return [...prev, newTask];
      const next = [...prev];
      next.splice(lastIdx + 1, 0, newTask);
      return next;
    });
    setNewTaskName("");
    setNewTaskType("checkbox");
    setNewTaskTarget(1);
    setNewTaskPoints(5);
    setShowAddForm(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    try {
      await updateRealtor(realtor.id, {
        coaching_focus: focus,
        martin_goals:   goals,
        priorities,
        yearly_goals:   yearlyGoals,
        tasks,
        current_gci:    currentGci,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaveSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave}>

      {/* Cards 1 & 2 — side by side */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="Realtor Info" noMargin>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-teal-500 mb-1">Name</label>
              <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">{realtor.name}</p>
            </div>
            <div>
              <label className="block text-xs text-teal-500 mb-1">Email</label>
              <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">{realtor.email}</p>
            </div>
            <Field label="Coaching focus">
              <input
                type="text"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Listings, Prospecting"
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <Card title="Coach Notes" noMargin>
          <div className="space-y-4">
            <Field label="Goals & notes for this realtor">
              <textarea
                rows={3}
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What should this realtor focus on this year?"
                className={textareaCls}
              />
            </Field>
            <Field label="Priorities">
              <textarea
                rows={3}
                value={priorities}
                onChange={(e) => setPriorities(e.target.value)}
                placeholder="Top 3 priorities for this realtor…"
                className={textareaCls}
              />
            </Field>
          </div>
        </Card>
      </div>

      {/* Card 3 — 2026 Yearly Goals */}
      <Card title="2026 Yearly Goals">
        <div className="grid grid-cols-6 gap-4">
          {(
            [
              ["Conservative GCI ($)",    "conservative_gci"],
              ["Stretch GCI ($)",          "stretch_gci"],
              ["Total deals",              "total_deals"],
              ["Buyer deals",              "buyer_deals"],
              ["Seller deals",             "seller_deals"],
              ["Current GCI to date ($)",  "__current_gci"],
            ] as [string, string][]
          ).map(([label, key]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                min={0}
                value={key === "__current_gci" ? currentGci : yearlyGoals[key as keyof YearlyGoals]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (key === "__current_gci") setCurrentGci(v);
                  else setYearlyGoals((prev) => ({ ...prev, [key]: v }));
                }}
                className={inputCls}
              />
            </Field>
          ))}
        </div>
      </Card>

      {/* Card 4 — Weekly Tasks */}
      <Card title="Weekly Tasks">
        {(() => {
          // Build ordered category list preserving original task order
          const seenCats: string[] = [];
          tasks.forEach((t) => { if (!seenCats.includes(t.category)) seenCats.push(t.category); });

          return (
            <div className="space-y-4">
              {seenCats.map((cat) => {
                const catTasks = tasks
                  .map((t, i) => ({ t, i }))
                  .filter(({ t }) => t.category === cat);

                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div className="col-span-2 mb-2">
                      <span className="inline-block text-[11px] font-semibold uppercase tracking-wider
                                       text-teal-600 bg-teal-100 rounded px-3 py-1.5">
                        {cat}
                      </span>
                    </div>

                    {/* 2-col task grid for this category */}
                    <div className="grid grid-cols-2 gap-x-6">
                      {catTasks.map(({ t, i }) => {
                        const isNumeric = t.type === "count" || t.input_type === "count";
                        return (
                          <div key={i} className="py-2 border-b border-teal-50 last:border-0 space-y-1.5">
                            {/* Line 1: toggle + label */}
                            <div className="flex items-center gap-2">
                              <Toggle checked={t.enabled} onChange={() => updateTask(i, { enabled: !t.enabled })} />
                              <input
                                type="text"
                                value={t.task}
                                onChange={(e) => updateTask(i, { task: e.target.value })}
                                placeholder="Task description"
                                className={`flex-1 min-w-0 text-sm bg-teal-50 border border-teal-200 rounded-lg px-2 py-1
                                            focus:outline-none focus:border-teal-400 transition-colors
                                            ${t.enabled ? "text-teal-800" : "text-teal-300"}`}
                              />
                            </div>

                            {/* Line 2: controls right-aligned */}
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              <div className="flex rounded-lg overflow-hidden border border-teal-200 text-xs shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateTask(i, { type: "checkbox", input_type: "checkbox" })}
                                  className={`px-2 py-1 transition-colors ${!isNumeric ? "bg-teal-500 text-white" : "text-teal-500 hover:bg-teal-50"}`}
                                >
                                  ✓ Checkbox
                                </button>
                                <button
                                  type="button"
                                  onClick={() => updateTask(i, { type: "count", input_type: "count" })}
                                  className={`px-2 py-1 transition-colors ${isNumeric ? "bg-teal-500 text-white" : "text-teal-500 hover:bg-teal-50"}`}
                                >
                                  # Numeric
                                </button>
                              </div>

                              {isNumeric && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-xs text-teal-400">target</span>
                                  <input
                                    type="number" min={1}
                                    value={t.target ?? 1}
                                    onChange={(e) => updateTask(i, { target: Number(e.target.value) })}
                                    className="w-14 border border-teal-200 rounded-lg px-2 py-1 text-xs text-teal-800 focus:outline-none focus:border-teal-400"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-xs text-teal-400">pts</span>
                                <input
                                  type="number" min={0}
                                  value={t.points}
                                  onChange={(e) => updateTask(i, { points: Number(e.target.value) })}
                                  className="w-14 border border-teal-200 rounded-lg px-2 py-1 text-xs text-teal-800 focus:outline-none focus:border-teal-400"
                                />
                              </div>

                              {t.is_custom && (
                                <button
                                  type="button"
                                  onClick={() => setTasks((prev) => prev.filter((_, idx) => idx !== i))}
                                  className="shrink-0 text-teal-300 hover:text-red-500 transition-colors text-base px-1"
                                  aria-label="Remove task"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Add custom task */}
        <div className="mt-4">
          {showAddForm ? (
            <div className="flex items-center gap-2 flex-wrap p-3 bg-teal-50 border border-teal-200 rounded-lg">
              {/* Category */}
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="text-xs border border-teal-200 rounded-lg px-2 py-1.5 text-teal-700 bg-white focus:outline-none focus:border-teal-400 shrink-0"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              {/* Task name — smaller, doesn't need to stretch */}
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTask())}
                placeholder="Task name"
                autoFocus
                className="flex-1 min-w-0 text-xs border border-teal-200 rounded-lg px-2 py-1.5 text-teal-800 bg-white focus:outline-none focus:border-teal-400"
              />

              {/* Type pill toggle */}
              <div className="flex rounded-lg overflow-hidden border border-teal-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setNewTaskType("checkbox")}
                  className={`px-2 py-1.5 transition-colors ${newTaskType === "checkbox" ? "bg-teal-500 text-white" : "text-teal-500 bg-white hover:bg-teal-50"}`}
                >
                  ✓ Checkbox
                </button>
                <button
                  type="button"
                  onClick={() => setNewTaskType("count")}
                  className={`px-2 py-1.5 transition-colors ${newTaskType === "count" ? "bg-teal-500 text-white" : "text-teal-500 bg-white hover:bg-teal-50"}`}
                >
                  # Numeric
                </button>
              </div>

              {/* Target (Numeric only) */}
              {newTaskType === "count" && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-teal-400">target</span>
                  <input
                    type="number" min={1}
                    value={newTaskTarget}
                    onChange={(e) => setNewTaskTarget(Number(e.target.value))}
                    className="w-14 text-xs border border-teal-200 rounded-lg px-2 py-1.5 text-teal-800 bg-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              )}

              {/* Points */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-teal-400">pts</span>
                <input
                  type="number" min={0}
                  value={newTaskPoints}
                  onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                  className="w-14 text-xs border border-teal-200 rounded-lg px-2 py-1.5 text-teal-800 bg-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <button
                type="button"
                onClick={addCustomTask}
                className="text-xs text-white bg-teal-500 hover:bg-teal-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewTaskName(""); setNewTaskType("checkbox"); setNewTaskTarget(1); setNewTaskPoints(5); }}
                className="text-xs text-teal-400 hover:text-teal-600 px-2 py-1.5 shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="text-xs text-teal-500 hover:text-teal-700 border border-dashed border-teal-200
                         hover:border-teal-400 rounded-lg px-3 py-1.5 transition-colors"
            >
              + Add custom task
            </button>
          )}
        </div>
      </Card>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

      {/* Live points total */}
      {(() => {
        const total = tasks.filter((t) => t.enabled).reduce((sum, t) => sum + (t.points || 0), 0);
        const met   = total >= 100;
        return (
          <p className={`text-sm font-medium mb-4 ${met ? "text-green-600" : "text-teal-400"}`}>
            Total: {total} / 100 pts{met ? " ✓" : ""}
          </p>
        );
      })()}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white
                     font-medium text-sm px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? "Saving…" : saveLabel}
        </button>
        {saved && (
          <div>
            <span className="text-sm text-teal-600 font-medium">Saved ✓</span>
            <p className="text-xs text-teal-400 mt-0.5">Changes will apply starting next week.</p>
          </div>
        )}
      </div>

    </form>
  );
}
