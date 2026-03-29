"use client";

// src/app/coach/page.tsx — Martin's coach dashboard

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { MetricCard } from "@/components/metric-card";
import { RealtorTable } from "@/components/realtor-table";
import { getRealtors, getPipelineStatus, runSundayReminder, Realtor, PipelineStatus } from "@/lib/api";

const MARTIN_EMAIL = process.env.NEXT_PUBLIC_MARTIN_EMAIL;

function weekLabel(): string {
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Week of ${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-teal-100 rounded animate-pulse ${className}`} />;
}

export default function CoachPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [realtors, setRealtors]   = useState<Realtor[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [reminderMsg, setReminder] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && session?.user?.email !== MARTIN_EMAIL) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([getRealtors(), getPipelineStatus()])
      .then(([rs, ps]) => {
        setRealtors(rs);
        setPipelineStatus(ps);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen bg-teal-50 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  // Metrics
  const activeCount = realtors.length;
  const weekScores  = realtors
    .map((r) => r.score_history.at(-1)?.percentage ?? null)
    .filter((p): p is number => p !== null);
  const teamAvg   = avg(weekScores);
  const submitted = weekScores.length;
  const topRealtor = realtors.reduce<{ name: string; pct: number } | null>((best, r) => {
    const pct = r.score_history.at(-1)?.percentage ?? 0;
    return !best || pct > best.pct ? { name: r.name.split(" ")[0], pct } : best;
  }, null);

  async function handleSendReminders() {
    setReminder("Sending…");
    try {
      await runSundayReminder(true);
      setReminder("Reminders sent (dry run). Toggle dry_run in API to go live.");
    } catch (e) {
      setReminder(`Error: ${(e as Error).message}`);
    }
  }

  const lastRun = pipelineStatus?.last_run;

  return (
    <div className="flex min-h-screen bg-teal-50">
      <Sidebar role="admin" />

      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-medium text-teal-800">Team overview</h1>
            <p className="text-sm text-teal-400 mt-1">{weekLabel()}</p>
          </div>
          <a
            href="/coach/scheduler"
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl
                       text-sm font-medium transition-colors"
          >
            Run pipeline now ↗
          </a>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Could not connect to API: {error}. Make sure the FastAPI server is running at localhost:8000.
          </div>
        )}

        {/* Metrics row */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Active realtors"
              value={activeCount}
            />
            <MetricCard
              label="Team avg this week"
              value={teamAvg}
              unit="%"
              pill={teamAvg >= 75 ? { text: "Strong", color: "green" }
                  : teamAvg >= 60 ? { text: "On Track", color: "amber" }
                  : { text: "Needs work", color: "teal" }}
            />
            <MetricCard
              label="Submitted last week"
              value={`${submitted}/${activeCount}`}
              sub={activeCount > 0 ? `${Math.round((submitted / activeCount) * 100)}% participation` : ""}
            />
            <MetricCard
              label="Top performer"
              value={topRealtor?.name ?? "—"}
              sub={topRealtor ? `${topRealtor.pct}% this week` : "No data yet"}
              pill={topRealtor && topRealtor.pct >= 90 ? { text: "🏆 Excellent", color: "green" } : undefined}
            />
          </div>
        )}

        {/* Realtor scorecards */}
        <div className="bg-white border border-teal-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-teal-800 mb-4">
            Realtor scorecards — this week
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <RealtorTable realtors={realtors} />
          )}
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Pipeline status */}
          <div className="bg-white border border-teal-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-teal-800 mb-4">⚙️ Automated pipeline</h2>
            <div className="space-y-3">
              {[
                { name: "Sunday reminder emails", schedule: "Sunday 8:00 AM",  event: "sunday_reminder" },
                { name: "Monday sheets + report",  schedule: "Monday 7:00 AM",  event: "monday_send" },
              ].map((job) => {
                const ran = pipelineStatus?.recent?.some((e) => e.event === job.event);
                return (
                  <div key={job.event} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-teal-800">{job.name}</p>
                      <p className="text-xs text-teal-400">{job.schedule}</p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full ${ran ? "bg-green-400" : "bg-teal-200"}`} />
                  </div>
                );
              })}
              {lastRun && (
                <p className="text-xs text-teal-400 pt-1">
                  Last event: <strong className="text-teal-600">{String(lastRun.event)}</strong>
                  {" "}&mdash;{" "}
                  {new Date(String(lastRun.timestamp)).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border border-teal-200 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-teal-800 mb-4">⚡ Quick actions</h2>
            <div className="space-y-2">
              {[
                { label: "Add new realtor",           href: "/coach/add" },
                { label: "Set this week's goals",     href: "/coach/realtors" },
                { label: "View last Monday's report", href: "/coach/reports" },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between w-full px-4 py-3 bg-teal-50
                             border border-teal-200 rounded-lg text-sm text-teal-700
                             hover:bg-teal-100 transition-colors"
                >
                  {action.label}
                  <span className="text-teal-400">→</span>
                </a>
              ))}
              <button
                onClick={handleSendReminders}
                className="flex items-center justify-between w-full px-4 py-3 bg-teal-50
                           border border-teal-200 rounded-lg text-sm text-teal-700
                           hover:bg-teal-100 transition-colors cursor-pointer"
              >
                Send Sunday reminders now
                <span className="text-teal-400">→</span>
              </button>
              {reminderMsg && (
                <p className="text-xs text-teal-600 px-1 pt-1">{reminderMsg}</p>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
