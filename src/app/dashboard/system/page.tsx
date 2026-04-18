"use client";

// src/app/dashboard/system/page.tsx — Finding My System

import { useEffect, useState } from "react";
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

// ── Presets (identical to coach form) ─────────────────────────────────────────

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

type Preset = { note: string; tasks: PresetTask[] };

const PRESETS: Record<string, Preset> = {
  "Ninja Selling": {
    note: "Verified \u2014 Official Ninja Nine (ninjaselling.com)",
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
    note: "Verified \u2014 MREA + KW Lead Generation 36:12:3",
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
    note: "Estimated \u2014 Serhant system philosophy",
    tasks: [
      pt("Prospecting",     "Prospecting calls",                          "count",    12, 30),
      pt("Prospecting",     "Expand sphere \u2014 new contacts added",    "count",    7,  5),
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
    note: "Estimated \u2014 Tom Ferry philosophy",
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
    note: "Estimated \u2014 Buffini system",
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
    note: "Estimated \u2014 The ONE Thing philosophy",
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
    note: "Estimated \u2014 BOLD/KW MAPS",
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

const SYSTEM_NAMES = [...Object.keys(PRESETS), "Custom"] as const;

const CATEGORIES = ["Prospecting", "Listings/Buyers", "Follow-Up", "Social/Brand", "Education", "Custom"] as const;

// ── System config persistence keys ────────────────────────────────────────────

const SYS_SEL_PREFIX = "system_sel:";
const SYS_HRS_PREFIX = "system_hrs:";

function parseSystemConfig(completed: Set<string>): { system: string | null; hours: number } {
  let system: string | null = null;
  let hours = 30;
  for (const k of completed) {
    if (k.startsWith(SYS_SEL_PREFIX)) system = decodeURIComponent(k.slice(SYS_SEL_PREFIX.length));
    if (k.startsWith(SYS_HRS_PREFIX)) hours = Number(k.slice(SYS_HRS_PREFIX.length)) || 30;
  }
  return { system, hours };
}

function findKey(completed: Set<string>, prefix: string): string | null {
  for (const k of completed) if (k.startsWith(prefix)) return k;
  return null;
}

function scalePreset(presetName: string, hours: number): Task[] {
  const preset = PRESETS[presetName];
  if (!preset) return [];
  return preset.tasks.map((t) => ({
    ...t,
    target: (t.type === "count" && t.baseTarget)
      ? Math.max(1, Math.round(t.baseTarget * (hours / 40)))
      : t.target,
  })) as Task[];
}

// ── Toggle ────────────────────────────────────────────────────────────────────

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

// ── Warning modal ─────────────────────────────────────────────────────────────

function WarningModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-2">Change tasks mid-week?</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          You&apos;ve already logged activity this week. Changing your task list mid-week
          may affect your current score. Your coach can see this change.
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
            className="px-4 py-2 text-sm font-medium text-white bg-[#FF6B35]
                       rounded-lg hover:bg-orange-600 transition-colors"
          >
            Save anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm font-medium
                    px-5 py-3 rounded-xl shadow-lg z-50">
      {message}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [realtor,       setRealtor]       = useState<Realtor | null>(null);
  const [completed,     setCompleted]     = useState<Set<string>>(new Set());
  const [coachTasks,    setCoachTasks]    = useState<Task[]>([]);
  const [tasks,         setTasks]         = useState<Task[]>([]);
  const [activePreset,  setActivePreset]  = useState<string>("");
  const [weeklyHours,   setWeeklyHours]   = useState<number>(30);
  const [showAddForm,   setShowAddForm]   = useState(false);
  const [newCategory,   setNewCategory]   = useState<string>("Custom");
  const [newTaskName,   setNewTaskName]   = useState("");
  const [newTaskType,   setNewTaskType]   = useState<"checkbox" | "count">("checkbox");
  const [newTaskTarget, setNewTaskTarget] = useState(1);
  const [newTaskPoints, setNewTaskPoints] = useState(5);
  const [saving,        setSaving]        = useState(false);
  const [showModal,     setShowModal]     = useState(false);
  const [toast,         setToast]         = useState<string | null>(null);
  const [error,         setError]         = useState("");
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const email = session?.user?.email ?? "";
    getRealtorByEmail(email).then((r) => {
      if (!r) { router.push("/"); return; }
      setRealtor(r);

      // Coach tasks: those NOT marked custom
      const ct = (r.tasks ?? []).filter((t) => !t.is_custom);
      setCoachTasks(ct);

      const rc = new Set(r.roadmap_completed ?? []);
      setCompleted(rc);

      // Restore system config
      const { system, hours } = parseSystemConfig(rc);
      setWeeklyHours(hours);
      if (system && SYSTEM_NAMES.includes(system as typeof SYSTEM_NAMES[number])) {
        setActivePreset(system);
        if (system !== "Custom") {
          // Use any previously-saved custom tasks as starting point, else load preset
          const saved = (r.tasks ?? []).filter((t) => t.is_custom);
          setTasks(saved.length ? saved : scalePreset(system, hours));
        } else {
          setTasks((r.tasks ?? []).filter((t) => t.is_custom));
        }
      } else {
        // No system selected yet — start from custom tasks already saved, or empty
        setTasks((r.tasks ?? []).filter((t) => t.is_custom));
      }
    }).finally(() => setLoading(false));
  }, [status, session, router]);

  // ── Task helpers ─────────────────────────────────────────────────────────────

  function updateTask(i: number, patch: Partial<Task>) {
    setTasks((prev) => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t));
  }

  function deleteTask(i: number) {
    setTasks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addCustomTask() {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      category: newCategory,
      task: newTaskName.trim(),
      points: newTaskPoints,
      type: newTaskType,
      input_type: newTaskType,
      enabled: true,
      is_custom: true,
      ...(newTaskType === "count" ? { target: newTaskTarget } : {}),
    };
    setTasks((prev) => {
      const lastIdx = prev.map((t, i) => t.category === newCategory ? i : -1).filter(i => i >= 0).at(-1);
      if (lastIdx === undefined) return [...prev, newTask];
      const next = [...prev];
      next.splice(lastIdx + 1, 0, newTask);
      return next;
    });
    setNewTaskName(""); setNewTaskType("checkbox"); setNewTaskTarget(1); setNewTaskPoints(5);
    setShowAddForm(false);
  }

  // ── System selection ─────────────────────────────────────────────────────────

  async function selectSystem(name: string) {
    if (!realtor) return;
    const prev = findKey(completed, SYS_SEL_PREFIX);
    const newKey = `${SYS_SEL_PREFIX}${encodeURIComponent(name)}`;

    setCompleted((c) => {
      const next = new Set(c);
      if (prev) next.delete(prev);
      next.add(newKey);
      return next;
    });
    setActivePreset(name);

    // Pre-populate tasks (only if switching systems — don't blow away current work on same system)
    if (name !== activePreset) {
      setTasks(name !== "Custom" ? scalePreset(name, weeklyHours) : []);
    }

    try {
      if (prev) await patchRoadmapItem(realtor.id, prev, false);
      const updated = await patchRoadmapItem(realtor.id, newKey, true);
      setCompleted(new Set(updated));
    } catch {
      setCompleted((c) => {
        const next = new Set(c);
        next.delete(newKey);
        if (prev) next.add(prev);
        return next;
      });
    }
  }

  // ── Hours change ─────────────────────────────────────────────────────────────

  function changeHours(h: number) {
    setWeeklyHours(h);
    setTasks((prev) => prev.map((t) => {
      if ((t.type === "count" || t.input_type === "count") && t.baseTarget) {
        return { ...t, target: Math.max(1, Math.round(t.baseTarget * (h / 40))) };
      }
      return t;
    }));
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  async function attemptSave() {
    if (!realtor) return;
    const enabledTotal = tasks.filter((t) => t.enabled).reduce((s, t) => s + (t.points || 0), 0);
    if (enabledTotal !== 100) {
      setError(`Enabled tasks must total exactly 100 points (currently ${enabledTotal}). Adjust before saving.`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const prog = await getProgress(realtor.id, currentWeekLabel()).catch(() => null);
      const score = (prog as { score?: number } | null)?.score ?? 0;
      if (score > 0) { setShowModal(true); setSaving(false); return; }
      await doSave();
    } catch {
      await doSave();
    }
  }

  async function doSave() {
    if (!realtor) return;
    setSaving(true);
    setShowModal(false);
    try {
      // Persist hours to roadmap_completed
      const oldHrsKey = findKey(completed, SYS_HRS_PREFIX);
      const newHrsKey = `${SYS_HRS_PREFIX}${weeklyHours}`;
      if (oldHrsKey && oldHrsKey !== newHrsKey) {
        await patchRoadmapItem(realtor.id, oldHrsKey, false);
      }
      const updatedRc = await patchRoadmapItem(realtor.id, newHrsKey, true);
      setCompleted(new Set(updatedRc));

      // Save tasks: merge coach tasks (unchanged) + realtor's editable tasks
      await updateRealtor(realtor.id, { tasks: [...coachTasks, ...tasks] });
      setToast("System saved. Your My Week tab will reflect these tasks.");
    } catch {
      setError("Save failed. Please try again.");
    } finally {
      setSaving(false);
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

  const enabledTotal = tasks.filter((t) => t.enabled).reduce((s, t) => s + (t.points || 0), 0);
  const totalExact   = enabledTotal === 100;
  const totalOver    = enabledTotal > 100;

  // Categories present in current task list
  const seenCats: string[] = [];
  tasks.forEach((t) => { if (!seenCats.includes(t.category)) seenCats.push(t.category); });

  const hrsPerDay = weeklyHours > 0 ? (weeklyHours / 5).toFixed(1) : "0";

  return (
    <div className="flex bg-[#F0FAFA]">
      <Sidebar role="realtor" />

      <main className="flex-1 p-8">
        <div>

          {/* ── Header ───────────────────────────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Finding My System</h1>
            <p className="text-sm text-[#0A4A50] mt-1">
              Build the weekly accountability system that fits how you want to work.
            </p>
          </div>

          {/* ── System selector ───────────────────────────────────────────────── */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Choose a system
            </p>
            <div className="flex gap-2 flex-wrap">
              {SYSTEM_NAMES.map((name) => {
                const active = activePreset === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectSystem(name)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                      ${active
                        ? "bg-[#0D5C63] border-[#0D5C63] text-white font-semibold"
                        : "bg-white border-[#B2DFDB] text-[#0D5C63] hover:border-[#0D5C63]"}`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
            {activePreset && PRESETS[activePreset] && (
              <p className="text-xs italic text-slate-400 mt-2">{PRESETS[activePreset].note}</p>
            )}
          </div>

          {/* ── Hours / week ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 mb-8">
            <span className="text-xs font-medium text-slate-600 shrink-0">Hours / week</span>
            <input
              type="number"
              min={10} max={60} step={5}
              value={weeklyHours}
              onChange={(e) => changeHours(Number(e.target.value))}
              className="w-20 text-sm border border-[#B2DFDB] rounded-lg px-3 py-1.5
                         text-slate-800 bg-white focus:outline-none focus:border-[#0D5C63]"
            />
            <span className="text-xs text-slate-500">
              {weeklyHours} hrs/week &middot; {hrsPerDay} hrs/day average
            </span>
          </div>

          {/* ── Task table ────────────────────────────────────────────────────── */}
          {activePreset ? (
            <div className="bg-white border border-[#B2DFDB] rounded-xl overflow-hidden mb-4">

              {tasks.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-400 mb-1">No tasks yet.</p>
                  <p className="text-xs text-slate-400">Add a custom task below to get started.</p>
                </div>
              ) : (
                <div className="p-4 space-y-5">
                  {seenCats.map((cat) => {
                    const catTasks = tasks
                      .map((t, i) => ({ t, i }))
                      .filter(({ t }) => t.category === cat);

                    return (
                      <div key={cat}>
                        {/* Category label */}
                        <div className="mb-2">
                          <span className="inline-block text-[11px] font-semibold uppercase tracking-wider
                                           text-teal-600 bg-teal-100 rounded px-3 py-1.5">
                            {cat}
                          </span>
                        </div>

                        {/* Task rows — 2-col grid matching coach form */}
                        <div className="grid grid-cols-2 gap-x-6">
                          {catTasks.map(({ t, i }) => {
                            const isNumeric = t.type === "count" || t.input_type === "count";
                            return (
                              <div key={i} className="py-2 border-b border-teal-50 last:border-0 space-y-1.5">
                                {/* Line 1: enable toggle + editable name */}
                                <div className="flex items-center gap-2">
                                  <Toggle
                                    checked={t.enabled}
                                    onChange={() => updateTask(i, { enabled: !t.enabled })}
                                  />
                                  <input
                                    type="text"
                                    value={t.task}
                                    onChange={(e) => updateTask(i, { task: e.target.value })}
                                    placeholder="Task description"
                                    className={`flex-1 min-w-0 text-sm bg-teal-50 border border-teal-200
                                                rounded-lg px-2 py-1 focus:outline-none focus:border-teal-400
                                                transition-colors
                                                ${t.enabled ? "text-teal-800" : "text-teal-300"}`}
                                  />
                                </div>

                                {/* Line 2: type toggle, target, pts, delete */}
                                <div className="flex items-center gap-2 justify-end flex-wrap">
                                  {/* Checkbox / Numeric toggle */}
                                  <div className="flex rounded-lg overflow-hidden border border-teal-200 text-xs shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => updateTask(i, { type: "checkbox", input_type: "checkbox" })}
                                      className={`px-2 py-1 transition-colors
                                        ${!isNumeric ? "bg-teal-500 text-white" : "text-teal-500 hover:bg-teal-50"}`}
                                    >
                                      ✓ Checkbox
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => updateTask(i, { type: "count", input_type: "count" })}
                                      className={`px-2 py-1 transition-colors
                                        ${isNumeric ? "bg-teal-500 text-white" : "text-teal-500 hover:bg-teal-50"}`}
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
                                        className="w-14 border border-teal-200 rounded-lg px-2 py-1
                                                   text-xs text-teal-800 focus:outline-none focus:border-teal-400"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-xs text-teal-400">pts</span>
                                    <input
                                      type="number" min={0}
                                      value={t.points}
                                      onChange={(e) => updateTask(i, { points: Number(e.target.value) })}
                                      className="w-14 border border-teal-200 rounded-lg px-2 py-1
                                                 text-xs text-teal-800 focus:outline-none focus:border-teal-400"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => deleteTask(i)}
                                    className="shrink-0 text-teal-300 hover:text-red-500 transition-colors text-base px-1"
                                    aria-label="Remove task"
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add custom task */}
              <div className="px-4 pb-4 pt-2 border-t border-teal-50">
                {showAddForm ? (
                  <div className="flex items-center gap-2 flex-wrap p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-xs border border-teal-200 rounded-lg px-2 py-1.5 text-teal-700
                                 bg-white focus:outline-none focus:border-teal-400 shrink-0"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTask())}
                      placeholder="Task name"
                      autoFocus
                      className="flex-1 min-w-0 text-xs border border-teal-200 rounded-lg px-2 py-1.5
                                 text-teal-800 bg-white focus:outline-none focus:border-teal-400"
                    />

                    <div className="flex rounded-lg overflow-hidden border border-teal-200 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setNewTaskType("checkbox")}
                        className={`px-2 py-1.5 transition-colors
                          ${newTaskType === "checkbox" ? "bg-teal-500 text-white" : "text-teal-500 bg-white hover:bg-teal-50"}`}
                      >
                        ✓ Checkbox
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTaskType("count")}
                        className={`px-2 py-1.5 transition-colors
                          ${newTaskType === "count" ? "bg-teal-500 text-white" : "text-teal-500 bg-white hover:bg-teal-50"}`}
                      >
                        # Numeric
                      </button>
                    </div>

                    {newTaskType === "count" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-teal-400">target</span>
                        <input
                          type="number" min={1}
                          value={newTaskTarget}
                          onChange={(e) => setNewTaskTarget(Number(e.target.value))}
                          className="w-14 text-xs border border-teal-200 rounded-lg px-2 py-1.5
                                     text-teal-800 bg-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-teal-400">pts</span>
                      <input
                        type="number" min={0}
                        value={newTaskPoints}
                        onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                        className="w-14 text-xs border border-teal-200 rounded-lg px-2 py-1.5
                                   text-teal-800 bg-white focus:outline-none focus:border-teal-400"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={addCustomTask}
                      className="text-xs text-white bg-teal-500 hover:bg-teal-600
                                 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTaskName(""); setNewTaskType("checkbox");
                        setNewTaskTarget(1); setNewTaskPoints(5);
                      }}
                      className="text-xs text-teal-400 hover:text-teal-600 px-2 py-1.5 shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddForm(true)}
                    className="text-xs text-teal-500 hover:text-teal-700 border border-dashed
                               border-teal-200 hover:border-teal-400 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    + Add custom task
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#B2DFDB] rounded-xl px-5 py-10 text-center mb-4">
              <p className="text-sm text-slate-400">Select a system above to get started.</p>
            </div>
          )}

          {/* ── Point total ───────────────────────────────────────────────────── */}
          {activePreset && (
            <p className={`text-sm font-medium mb-4
              ${totalExact ? "text-green-600" : totalOver ? "text-red-500" : "text-amber-500"}`}>
              Total: {enabledTotal} / 100 pts
              {totalExact ? " ✓" : totalOver
                ? ` \u2014 remove ${enabledTotal - 100} pts`
                : ` \u2014 add ${100 - enabledTotal} pts`}
            </p>
          )}

          {/* ── Error ─────────────────────────────────────────────────────────── */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg
                          px-4 py-2.5 mb-4">
              {error}
            </p>
          )}

          {/* ── Save button ───────────────────────────────────────────────────── */}
          {activePreset && (
            <button
              type="button"
              onClick={attemptSave}
              disabled={saving}
              className="bg-[#FF6B35] hover:bg-orange-600 disabled:opacity-50 text-white
                         font-medium text-sm px-6 py-2.5 rounded-xl transition-colors"
            >
              {saving ? "Saving\u2026" : "Save My System"}
            </button>
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
