// src/lib/api.ts — Typed fetch helpers for the MJ Realty Coaching API

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface YearlyGoals {
  conservative_gci: number;
  stretch_gci:      number;
  total_deals:      number;
  buyer_deals:      number;
  seller_deals:     number;
}

export interface Task {
  category:   string;
  task:       string;
  points:     number;
  type:       string;
  input_type?: "checkbox" | "count" | "yes_no";
  enabled:    boolean;
  is_custom:  boolean;
  target?:    number;
}

export interface ScoreHistoryEntry {
  week_label:      string;
  score:           number;
  total_possible:  number;
  percentage:      number;
  date:            string;
  category_scores?: Record<string, number>;
}

export interface Realtor {
  id:                  string;
  name:                string;
  email:               string;
  coaching_focus:      string;
  martin_goals:        string;
  priorities:          string;
  yearly_goals:        YearlyGoals;
  tasks:               Task[];
  score_history:       ScoreHistoryEntry[];
  folder_id:           string;
  folder_url:          string;
  current_gci:         number;
  current_deals:       number;
  current_buyers:      number;
  current_sellers:     number;
  last_goals_updated?: string;
}

export interface NewRealtorInput {
  name:            string;
  email:           string;
  coaching_focus?: string;
}

export interface UpdateRealtorInput {
  name?:               string;
  email?:              string;
  coaching_focus?:     string;
  martin_goals?:       string;
  priorities?:         string;
  yearly_goals?:       YearlyGoals;
  tasks?:              Task[];
  current_gci?:        number;
  current_deals?:      number;
  current_buyers?:     number;
  current_sellers?:    number;
  last_goals_updated?: string;
}

export interface PipelineLogEntry {
  event:       string;
  timestamp:   string;
  week_label?: string;
  dry_run?:    boolean;
  [key: string]: unknown;
}

export interface PipelineStatus {
  last_run:      PipelineLogEntry | null;
  total_entries: number;
  recent:        PipelineLogEntry[];
}

// ── Progress types ─────────────────────────────────────────────────────────────

export interface ProgressTask {
  category:      string;
  task:          string;
  points:        number;
  enabled:       boolean;
  done:          boolean;
  input_type?:   "count" | "yes_no" | "checkbox";
  target?:       number;
  daily_counts?: Record<string, number>;
  weekly_total?: number;
  earned_points?: number;
}

export interface ActivityRow {
  day:               string;
  Prospecting:       number;
  "Listings / Buyers": number;
  "Follow-Up":       number;
  "Social / Brand":  number;
  Education:         number;
  "Notes / Wins":    string;
}

export interface WeekProgress {
  realtor_id:     string;
  week_label:     string;
  tasks:          ProgressTask[];
  activity_log:   ActivityRow[];
  notes:          string;
  daily_focus:    Record<string, boolean[]>;
  score:          number;
  total_possible: number;
  percentage:     number;
  last_updated:   string;
}

export const saveProgress = (realtorId: string, weekLabel: string, data: { tasks: ProgressTask[]; notes: string }) =>
  apiFetch<WeekProgress>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}`,
    { method: "POST", body: JSON.stringify(data) }
  );

// ── Core fetch helper ──────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Admin (super-admin) ────────────────────────────────────────────────────────

export interface AdminCoach {
  id:          string;
  name:        string;
  email:       string;
  active:      boolean;
  realtors:    Realtor[];
}

export interface AdminRealtor {
  id:         string;
  name:       string;
  email:      string;
  active:     boolean;
  coach_id:   string | null;
  coach_name: string | null;
}

export const getAdminCoaches = () =>
  apiFetch<AdminCoach[]>("/api/admin/coaches");

export const getAdminRealtors = () =>
  apiFetch<AdminRealtor[]>("/api/admin/realtors");

export const createAdminCoach = (data: { name: string; email: string }) =>
  apiFetch<AdminCoach>("/api/admin/coaches", { method: "POST", body: JSON.stringify(data) });

export const deleteAdminCoach = (id: string) =>
  apiFetch<{ status: string }>(`/api/admin/coaches/${id}`, { method: "DELETE" });

export const updateAdminCoach = (id: string, data: Partial<{ name: string; email: string; active: boolean }>) =>
  apiFetch<AdminCoach>(`/api/admin/coaches/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const createAdminRealtor = (data: { name: string; email: string; coach_id?: string; coaching_focus?: string }) =>
  apiFetch<AdminRealtor>("/api/admin/realtors", { method: "POST", body: JSON.stringify(data) });

export const deleteAdminRealtor = (id: string) =>
  apiFetch<{ status: string }>(`/api/admin/realtors/${id}`, { method: "DELETE" });

export const updateAdminRealtor = (id: string, data: Partial<{ name: string; email: string; active: boolean }>) =>
  apiFetch<AdminRealtor>(`/api/admin/realtors/${id}`, { method: "PATCH", body: JSON.stringify(data) });

export const assignAdminRealtor = (id: string, coach_id: string) =>
  apiFetch<AdminRealtor>(`/api/admin/realtors/${id}/assign`, { method: "POST", body: JSON.stringify({ coach_id }) });

// ── Coaches ────────────────────────────────────────────────────────────────────

export interface Coach {
  id:          string;
  name:        string;
  email:       string;
  realtor_ids: string[];
}

export const getCoaches = () =>
  apiFetch<Coach[]>("/api/coaches");

export const getCoachByEmail = (email: string) =>
  apiFetch<Coach | null>(`/api/coaches/by-email/${encodeURIComponent(email)}`);

export const getCoachRealtors = (coachId: string) =>
  apiFetch<Realtor[]>(`/api/coaches/${coachId}/realtors`);

export const assignRealtorToCoach = (coachId: string, realtorId: string) =>
  apiFetch<Coach>(`/api/coaches/${coachId}/realtors/${realtorId}`, { method: "POST" });

export const removeRealtorFromCoach = (coachId: string, realtorId: string) =>
  apiFetch<Coach>(`/api/coaches/${coachId}/realtors/${realtorId}`, { method: "DELETE" });

// ── Realtors ───────────────────────────────────────────────────────────────────

export const getRealtors = () =>
  apiFetch<Realtor[]>("/api/realtors");

export const getRealtorByEmail = (email: string) =>
  apiFetch<Realtor | null>(`/api/realtors/by-email/${encodeURIComponent(email)}`);

export const getRealtor = (id: string) =>
  apiFetch<Realtor>(`/api/realtors/${id}`);

export async function registerSelf(name: string, email: string): Promise<Realtor> {
  const res = await fetch(`${BASE}/api/realtors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, coaching_focus: "General coaching" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 409) return getRealtorByEmail(email) as Promise<Realtor>;
    throw new Error((err as { detail?: string }).detail ?? "Failed to register");
  }
  return res.json() as Promise<Realtor>;
}

export const addRealtor = (data: NewRealtorInput) =>
  apiFetch<Realtor>("/api/realtors", {
    method: "POST",
    body:   JSON.stringify(data),
  });

export const updateRealtor = (id: string, data: UpdateRealtorInput) =>
  apiFetch<Realtor>(`/api/realtors/${id}`, {
    method: "PUT",
    body:   JSON.stringify(data),
  });

export const deleteRealtor = (id: string) =>
  apiFetch<{ status: string; id: string }>(`/api/realtors/${id}`, {
    method: "DELETE",
  });

export const getRealtorHistory = (id: string) =>
  apiFetch<{ realtor_id: string; realtor_name: string; score_history: ScoreHistoryEntry[] }>(
    `/api/realtors/${id}/history`
  );

// ── Pipeline ───────────────────────────────────────────────────────────────────

export const getPipelineStatus = () =>
  apiFetch<PipelineStatus>("/api/pipeline/status");

export const runMondayPipeline = (dryRun = false) =>
  apiFetch<Record<string, unknown>>("/api/pipeline/monday", {
    method: "POST",
    body:   JSON.stringify({ dry_run: dryRun }),
  });

export const runSundayReminder = (dryRun = false) =>
  apiFetch<Record<string, unknown>>("/api/pipeline/sunday", {
    method: "POST",
    body:   JSON.stringify({ dry_run: dryRun }),
  });

// ── Progress ───────────────────────────────────────────────────────────────────

export const getAllProgress = (realtorId: string) =>
  apiFetch<WeekProgress[]>(`/api/progress/${encodeURIComponent(realtorId)}`);

export const getProgress = (realtorId: string, weekLabel: string) =>
  apiFetch<WeekProgress>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}`
  );

/** Legacy toggle — used by history page for old-schema weeks */
export const toggleTask = (realtorId: string, weekLabel: string, task: string, done: boolean) =>
  apiFetch<WeekProgress>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}/task`,
    {
      method: "PATCH",
      body:   JSON.stringify({ task, done }),
    }
  );

export type TaskPatchBody =
  | { task: string; action: "set_count"; day: string; value: number }
  | { task: string; action: "toggle_yes_no" };

export const patchTask = (realtorId: string, weekLabel: string, body: TaskPatchBody) =>
  apiFetch<WeekProgress>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}/task`,
    {
      method: "PATCH",
      body:   JSON.stringify(body),
    }
  );

export const saveDailyFocus = (
  realtorId: string,
  weekLabel: string,
  date: string,
  items: boolean[]
) =>
  apiFetch<{ status: string }>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}/daily`,
    { method: "PATCH", body: JSON.stringify({ date, items }) }
  );

export const saveActivityCell = (
  realtorId: string,
  weekLabel: string,
  day: string,
  column: string,
  value: number | string
) =>
  apiFetch<{ status: string }>(
    `/api/progress/${encodeURIComponent(realtorId)}/${encodeURIComponent(weekLabel)}/activity`,
    {
      method: "POST",
      body:   JSON.stringify({ day, column, value }),
    }
  );
