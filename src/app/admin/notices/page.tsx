"use client";

// src/app/admin/notices/page.tsx — Super-admin notice management

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getNoticesAdmin, createNotice, updateNotice, deleteNotice,
  Notice,
} from "@/lib/api";

const SUPER_ADMIN = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

function Spinner() {
  return <div className="w-7 h-7 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />;
}

function AudiencePill({ audience }: { audience: string }) {
  const styles: Record<string, string> = {
    all:      "bg-teal-100 text-teal-700",
    realtors: "bg-blue-100 text-blue-700",
    coaches:  "bg-orange-100 text-orange-700",
  };
  const labels: Record<string, string> = {
    all: "All", realtors: "Realtors", coaches: "Coaches",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[audience] ?? "bg-teal-100 text-teal-700"}`}>
      {labels[audience] ?? audience}
    </span>
  );
}

function NoticeForm({
  initial, onSave, onCancel, saving,
}: {
  initial: { title: string; body: string; audience: string };
  onSave:  (data: { title: string; body: string; audience: string }) => void;
  onCancel: () => void;
  saving:  boolean;
}) {
  const [title,    setTitle]    = useState(initial.title);
  const [body,     setBody]     = useState(initial.body);
  const [audience, setAudience] = useState(initial.audience);

  return (
    <div className="space-y-3">
      <input
        value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm text-teal-800
                   focus:outline-none focus:border-teal-400 bg-teal-50"
      />
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Body — supports multiple paragraphs (one per line)"
        rows={6}
        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm text-teal-800
                   focus:outline-none focus:border-teal-400 bg-teal-50 resize-y"
      />
      <select
        value={audience} onChange={(e) => setAudience(e.target.value)}
        className="w-full border border-teal-200 rounded-lg px-3 py-2 text-sm text-teal-700
                   focus:outline-none focus:border-teal-400 bg-teal-50"
      >
        <option value="all">All</option>
        <option value="realtors">Realtors only</option>
        <option value="coaches">Coaches only</option>
      </select>
      <div className="flex gap-2">
        <button
          onClick={() => onSave({ title, body, audience })}
          disabled={saving || !title.trim() || !body.trim()}
          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs
                     font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="border border-teal-200 text-teal-600 text-xs px-4 py-2 rounded-lg
                     hover:bg-teal-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminNoticesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [notices,    setNotices]    = useState<Notice[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [confirmId,  setConfirmId]  = useState<string | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const email = session?.user?.email ?? "";

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/"); return; }
    if (status !== "authenticated")   return;
    if (SUPER_ADMIN && email.toLowerCase() !== SUPER_ADMIN.toLowerCase()) {
      router.push("/");
      return;
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, email]);

  async function load() {
    setLoading(true); setError(null);
    try { setNotices(await getNoticesAdmin()); }
    catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function handleCreate(data: { title: string; body: string; audience: string }) {
    setSaving(true);
    try {
      await createNotice(data);
      setShowAdd(false);
      load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string, data: { title: string; body: string; audience: string }) {
    setSaving(true);
    try {
      await updateNotice(id, data);
      setEditingId(null);
      load();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try { await deleteNotice(id); setConfirmId(null); load(); }
    catch (e) { setError((e as Error).message); }
  }

  async function handleToggleActive(n: Notice) {
    try { await updateNotice(n.id, { active: !n.active }); load(); }
    catch (e) { setError((e as Error).message); }
  }

  function fmtDate(s: string) {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  if (status === "loading") {
    return <div className="min-h-screen bg-teal-50 flex items-center justify-center"><Spinner /></div>;
  }
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-teal-50">
      {/* Confirm dialog */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-teal-200 shadow-lg p-6 max-w-sm w-full mx-4">
            <p className="text-sm text-teal-800 mb-5">Delete this notice? It will be hidden from all users.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmId(null)}
                className="px-4 py-2 text-sm text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmId)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-teal-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/admin" className="text-sm text-teal-400 hover:text-teal-600 transition-colors">← Admin</a>
          <span className="text-teal-200">|</span>
          <span className="font-semibold text-teal-800 text-sm">Manage Notices</span>
        </div>
      </header>

      <div className="p-8 max-w-3xl">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
        )}

        {/* Add button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-teal-800">Notices</h1>
          {!showAdd && (
            <button
              onClick={() => { setShowAdd(true); setEditingId(null); }}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium
                         px-4 py-2 rounded-lg transition-colors"
            >
              + Add Notice
            </button>
          )}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white border border-teal-200 rounded-xl p-5 mb-4">
            <p className="text-sm font-semibold text-teal-800 mb-3">New Notice</p>
            <NoticeForm
              initial={{ title: "", body: "", audience: "all" }}
              onSave={handleCreate}
              onCancel={() => setShowAdd(false)}
              saving={saving}
            />
          </div>
        )}

        {/* Notice list */}
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : notices.length === 0 ? (
          <div className="bg-white border border-teal-200 rounded-xl px-6 py-10 text-center">
            <p className="text-teal-400 text-sm">No notices yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl overflow-hidden ${n.active ? "border-teal-200" : "border-teal-100 opacity-60"}`}
              >
                {editingId === n.id ? (
                  <div className="p-5">
                    <p className="text-xs font-semibold text-teal-700 mb-3">Editing notice</p>
                    <NoticeForm
                      initial={{ title: n.title, body: n.body, audience: n.audience }}
                      onSave={(data) => handleUpdate(n.id, data)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-4 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-teal-800 truncate">{n.title}</span>
                        <AudiencePill audience={n.audience} />
                        {!n.active && (
                          <span className="text-[10px] bg-teal-100 text-teal-400 px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-teal-400">{fmtDate(n.created_at)}</p>
                      <p className="text-sm text-teal-600 mt-1 line-clamp-2">{n.body.split("\n")[0]}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(n)}
                        title={n.active ? "Deactivate" : "Activate"}
                        className={`relative inline-flex w-9 h-5 rounded-full transition-colors shrink-0
                                    ${n.active ? "bg-teal-500" : "bg-teal-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                                          ${n.active ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                      <button
                        onClick={() => { setEditingId(n.id); setShowAdd(false); }}
                        className="text-xs text-teal-500 hover:text-teal-700 border border-teal-200
                                   px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmId(n.id)}
                        className="text-xs text-teal-300 hover:text-red-500 transition-colors px-1"
                        aria-label="Delete notice"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
