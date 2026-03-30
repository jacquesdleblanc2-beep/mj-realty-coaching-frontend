"use client";

// src/app/coach/history/page.tsx — Pipeline send history

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { getPipelineStatus, PipelineStatus } from "@/lib/api";

export default function HistoryPage() {
  const [status,  setStatus]  = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getPipelineStatus()
      .then(setStatus)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">Send History</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white border border-teal-200 rounded-xl p-6 max-w-4xl">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
            </div>
          ) : !status?.recent?.length ? (
            <p className="text-sm text-teal-400 text-center py-12">
              No pipeline events recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-teal-100">
                    {["Event", "Date & Time", "Week", "Dry Run"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 text-[11px] uppercase tracking-wider
                                   text-teal-400 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {status.recent.map((e, i) => (
                    <tr key={i} className="border-b border-teal-50 last:border-0">
                      <td className="py-3 px-4 font-medium text-teal-800">
                        {String(e.event)}
                      </td>
                      <td className="py-3 px-4 text-teal-600">
                        {new Date(String(e.timestamp)).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-teal-500">
                        {e.week_label ? String(e.week_label) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        {e.dry_run ? (
                          <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                            No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
