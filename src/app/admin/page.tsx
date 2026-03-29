"use client";

// src/app/admin/page.tsx — Super-admin portal
//
// Access is gated by NEXT_PUBLIC_SUPER_ADMIN_EMAIL.
// Set this env var in Vercel (Settings → Environment Variables).
// Only the exact email matching this value can reach this page.
// Never hardcode an email here — use the env var.

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AdminCoach,
  AdminRealtor,
  getAdminCoaches,
  getAdminRealtors,
  createAdminCoach,
  deleteAdminCoach,
  updateAdminCoach,
  createAdminRealtor,
  deleteAdminRealtor,
  updateAdminRealtor,
  assignAdminRealtor,
} from "@/lib/api";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

// ── Small shared components ────────────────────────────────────────────────────

function Spinner({ small }: { small?: boolean }) {
  const sz = small ? "w-4 h-4 border" : "w-8 h-8 border-2";
  return (
    <div className={`${sz} rounded-full border-teal-600 border-t-transparent animate-spin`} />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors shrink-0
                  ${checked ? "bg-teal-500" : "bg-teal-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                    ${checked ? "translate-x-4" : "translate-x-0"}`}
      />
    </button>
  );
}

function ConfirmDialog({
  message, onConfirm, onCancel,
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-teal-200 shadow-lg p-6 max-w-sm w-full mx-4">
        <p className="text-sm text-teal-800 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Coaches panel ──────────────────────────────────────────────────────────────

function CoachesPanel({
  coaches, onRefresh,
}: { coaches: AdminCoach[]; onRefresh: () => void }) {
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [formName,  setFormName]  = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const [confirm,   setConfirm]   = useState<string | null>(null);

  async function handleAdd() {
    if (!formName.trim() || !formEmail.trim()) { setFormError("Name and email are required."); return; }
    setSaving(true); setFormError("");
    try {
      await createAdminCoach({ name: formName.trim(), email: formEmail.trim() });
      setFormName(""); setFormEmail(""); setShowForm(false);
      onRefresh();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteAdminCoach(id); onRefresh(); }
    catch (e) { alert((e as Error).message); }
    finally { setConfirm(null); }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try { await updateAdminCoach(id, { active: !current }); onRefresh(); }
    catch (e) { alert((e as Error).message); }
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6">
      {confirm && (
        <ConfirmDialog
          message="Delete this coach? Their realtors will become unassigned."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-teal-800">Coaches</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium
                     px-3 py-1.5 rounded-lg transition-colors"
        >
          + Add Coach
        </button>
      </div>

      <div className="space-y-2">
        {coaches.map((c) => (
          <div key={c.id} className="border border-teal-100 rounded-lg overflow-hidden">
            {/* Row */}
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-teal-50 transition-colors"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-teal-800">{c.name}</span>
                <span className="ml-2 text-xs text-teal-400">{c.email}</span>
              </div>
              <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full shrink-0">
                {c.realtors.length} realtor{c.realtors.length !== 1 ? "s" : ""}
              </span>
              <Toggle checked={c.active} onChange={() => handleToggleActive(c.id, c.active)} />
              <button
                onClick={(e) => { e.stopPropagation(); setConfirm(c.id); }}
                className="text-teal-300 hover:text-red-500 transition-colors text-base px-1"
                aria-label="Delete coach"
              >
                🗑
              </button>
              <span className="text-teal-300 text-xs">{expanded === c.id ? "▲" : "▼"}</span>
            </div>
            {/* Expanded sub-list */}
            {expanded === c.id && (
              <div className="border-t border-teal-100 bg-teal-50 px-4 py-3 space-y-1.5">
                {c.realtors.length === 0 ? (
                  <p className="text-xs text-teal-400">No realtors assigned.</p>
                ) : c.realtors.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-teal-700">{r.name}</span>
                    <span className="text-xs text-teal-400">{r.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 p-4 border border-teal-200 rounded-xl bg-teal-50 space-y-3">
          <p className="text-xs font-semibold text-teal-700">New coach</p>
          <input
            value={formName} onChange={(e) => setFormName(e.target.value)}
            placeholder="Name"
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-sm
                       text-teal-800 focus:outline-none focus:border-teal-400"
          />
          <input
            value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-sm
                       text-teal-800 focus:outline-none focus:border-teal-400"
          />
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd} disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white
                         text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormName(""); setFormEmail(""); setFormError(""); }}
              className="text-xs text-teal-600 border border-teal-200 px-4 py-2 rounded-lg
                         hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Realtors panel ─────────────────────────────────────────────────────────────

function RealtorsPanel({
  realtors, coaches, onRefresh,
}: { realtors: AdminRealtor[]; coaches: AdminCoach[]; onRefresh: () => void }) {
  const [showForm,    setShowForm]    = useState(false);
  const [formName,    setFormName]    = useState("");
  const [formEmail,   setFormEmail]   = useState("");
  const [formCoachId, setFormCoachId] = useState("");
  const [saving,      setSaving]      = useState(false);
  const [formError,   setFormError]   = useState("");
  const [confirm,     setConfirm]     = useState<string | null>(null);
  const [reassigning, setReassigning] = useState<string | null>(null);

  async function handleAdd() {
    if (!formName.trim() || !formEmail.trim()) { setFormError("Name and email are required."); return; }
    setSaving(true); setFormError("");
    try {
      await createAdminRealtor({
        name:     formName.trim(),
        email:    formEmail.trim(),
        coach_id: formCoachId || undefined,
      });
      setFormName(""); setFormEmail(""); setFormCoachId(""); setShowForm(false);
      onRefresh();
    } catch (e) { setFormError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteAdminRealtor(id); onRefresh(); }
    catch (e) { alert((e as Error).message); }
    finally { setConfirm(null); }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try { await updateAdminRealtor(id, { active: !current }); onRefresh(); }
    catch (e) { alert((e as Error).message); }
  }

  async function handleReassign(id: string, coachId: string) {
    if (!coachId) return;
    setReassigning(id);
    try { await assignAdminRealtor(id, coachId); onRefresh(); }
    catch (e) { alert((e as Error).message); }
    finally { setReassigning(null); }
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6">
      {confirm && (
        <ConfirmDialog
          message="Delete this realtor? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-teal-800">Realtors</h2>
        <button
          onClick={() => { setShowForm((v) => !v); setFormError(""); }}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium
                     px-3 py-1.5 rounded-lg transition-colors"
        >
          + Add Realtor
        </button>
      </div>

      <div className="space-y-2">
        {realtors.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3 border border-teal-100
                                      rounded-lg hover:bg-teal-50 transition-colors">
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-teal-800">{r.name}</span>
              <span className="ml-2 text-xs text-teal-400">{r.email}</span>
            </div>
            {/* Coach badge */}
            <div className="shrink-0">
              {r.coach_name ? (
                <span className="text-xs bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">
                  {r.coach_name}
                </span>
              ) : (
                <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  Unassigned
                </span>
              )}
            </div>
            {/* Reassign dropdown */}
            <div className="shrink-0">
              {reassigning === r.id ? (
                <Spinner small />
              ) : (
                <select
                  value={r.coach_id ?? ""}
                  onChange={(e) => e.target.value && handleReassign(r.id, e.target.value)}
                  className="text-xs border border-teal-200 rounded-lg px-2 py-1 text-teal-700
                             bg-white focus:outline-none focus:border-teal-400 cursor-pointer"
                >
                  <option value="">Reassign…</option>
                  {coaches.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <Toggle checked={r.active} onChange={() => handleToggleActive(r.id, r.active)} />
            <button
              onClick={() => setConfirm(r.id)}
              className="text-teal-300 hover:text-red-500 transition-colors text-base px-1"
              aria-label="Delete realtor"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mt-4 p-4 border border-teal-200 rounded-xl bg-teal-50 space-y-3">
          <p className="text-xs font-semibold text-teal-700">New realtor</p>
          <input
            value={formName} onChange={(e) => setFormName(e.target.value)}
            placeholder="Name"
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-sm
                       text-teal-800 focus:outline-none focus:border-teal-400"
          />
          <input
            value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-sm
                       text-teal-800 focus:outline-none focus:border-teal-400"
          />
          <select
            value={formCoachId} onChange={(e) => setFormCoachId(e.target.value)}
            className="w-full bg-white border border-teal-200 rounded-lg px-3 py-2 text-sm
                       text-teal-700 focus:outline-none focus:border-teal-400"
          >
            <option value="">No coach (unassigned)</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd} disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white
                         text-xs font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setShowForm(false); setFormName(""); setFormEmail(""); setFormCoachId(""); setFormError(""); }}
              className="text-xs text-teal-600 border border-teal-200 px-4 py-2 rounded-lg
                         hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [coaches,  setCoaches]  = useState<AdminCoach[]>([]);
  const [realtors, setRealtors] = useState<AdminRealtor[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
      return;
    }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, email]);

  async function fetchAll() {
    setLoading(true); setError(null);
    try {
      const [c, r] = await Promise.all([getAdminCoaches(), getAdminRealtors()]);
      setCoaches(c);
      setRealtors(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-teal-50 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-teal-50">

      {/* Top nav */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">MJ</span>
          </div>
          <span className="font-semibold text-teal-800 text-sm">Admin</span>
          <span className="text-xs text-teal-300 border border-teal-200 px-2 py-0.5 rounded-full ml-1">
            super-admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-teal-600">{session?.user?.name ?? email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-xs text-teal-400 hover:text-teal-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Could not connect to API: {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CoachesPanel  coaches={coaches}   onRefresh={fetchAll} />
            <RealtorsPanel realtors={realtors} coaches={coaches} onRefresh={fetchAll} />
          </div>
        )}
      </div>
    </div>
  );
}
