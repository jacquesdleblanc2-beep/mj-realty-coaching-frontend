"use client";

// src/app/coach/scheduler/page.tsx — Pipeline scheduler (dry-run)

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { runSundayReminder, runMondayPipeline } from "@/lib/api";

function PipelineCard({
  title,
  description,
  buttonLabel,
  onRun,
}: {
  title:       string;
  description: string;
  buttonLabel: string;
  onRun:       () => Promise<void>;
}) {
  const [running, setRunning] = useState(false);
  const [result,  setResult]  = useState<string | null>(null);

  async function handleClick() {
    setRunning(true); setResult(null);
    try {
      await onRun();
      setResult("Done. Check server logs for details.");
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white border border-teal-200 rounded-xl p-6">
      <h2 className="text-sm font-semibold text-teal-800 mb-1">{title}</h2>
      <p className="text-xs text-teal-400 mb-5">{description}</p>
      <button
        onClick={handleClick}
        disabled={running}
        className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white
                   text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
      >
        {running ? "Running…" : buttonLabel}
      </button>
      {result && (
        <p className="mt-3 text-xs text-teal-600 bg-teal-50 border border-teal-200
                      rounded-lg px-4 py-2.5">
          {result}
        </p>
      )}
    </div>
  );
}

export default function SchedulerPage() {
  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        <div className="mb-8">
          <h1 className="text-2xl font-medium text-teal-800">Pipeline Scheduler</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl">
          <PipelineCard
            title="Sunday 8:00 AM — Reminder emails"
            description="Sends weekly check-in reminder to all realtors."
            buttonLabel="Run now (dry run)"
            onRun={() => runSundayReminder(true)}
          />
          <PipelineCard
            title="Monday 7:00 AM — Collect scores & report"
            description="Collects scores, creates sheets, emails coach report."
            buttonLabel="Run now (dry run)"
            onRun={() => runMondayPipeline(true)}
          />
        </div>

        <p className="mt-8 text-xs text-teal-400 max-w-lg">
          Running in dry-run mode — no real emails sent.
          Toggle <code className="text-teal-600">dry_run</code> in the backend to go live.
        </p>

      </main>
    </div>
  );
}
