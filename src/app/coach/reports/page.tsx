"use client";

// src/app/coach/reports/page.tsx — Weekly reports (coming soon)

import { Sidebar } from "@/components/sidebar";

export default function ReportsPage() {
  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">Reports</h1>
        </div>

        <div className="bg-white border border-teal-200 rounded-xl p-12 max-w-lg text-center">
          <p className="text-3xl mb-4">📊</p>
          <p className="text-sm font-medium text-teal-800 mb-2">Weekly reports coming soon.</p>
          <p className="text-xs text-teal-400">
            After Monday&apos;s pipeline runs, coach reports will appear here.
          </p>
        </div>

      </main>
    </div>
  );
}
