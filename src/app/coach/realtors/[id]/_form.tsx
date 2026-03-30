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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6">
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

export function StrategyForm({ realtor, saveLabel = "Save Changes", onSaveSuccess }: StrategyFormProps) {
  const initTasks = realtor.tasks?.length ? realtor.tasks : DEFAULT_TASKS;

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
  const [currentGci,  setCurrentGci]  = useState(realtor.current_gci ?? 0);
  const [tasks,       setTasks]       = useState<Task[]>(initTasks);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [saved,       setSaved]       = useState(false);

  function updateTask(i: number, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
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

      {/* Card 1 — Realtor Info */}
      <Card title="Realtor Info">
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

      {/* Card 2 — Coach Notes */}
      <Card title="Coach Notes">
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

      {/* Card 3 — 2026 Yearly Goals */}
      <Card title="2026 Yearly Goals">
        <div className="grid grid-cols-2 gap-4">
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
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-teal-50 last:border-0">
              <Toggle checked={t.enabled} onChange={() => updateTask(i, { enabled: !t.enabled })} />
              <span className={`flex-1 text-sm ${t.enabled ? "text-teal-800" : "text-teal-300"}`}>
                {t.task}
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-500 px-1.5 py-0.5 rounded shrink-0">
                {t.type}
              </span>
              {t.type === "count" && (
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
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

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
          <span className="text-sm text-teal-600 font-medium">Saved ✓</span>
        )}
      </div>

    </form>
  );
}
