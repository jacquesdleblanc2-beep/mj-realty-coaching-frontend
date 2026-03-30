"use client";

// src/components/realtor-table.tsx

import Link from "next/link";
import { Realtor } from "@/lib/api";
import { ScoreBar } from "./score-bar";

function scoreLabel(pct: number): { text: string; cls: string } {
  if (pct >= 90) return { text: "Excellent",  cls: "bg-green-100 text-green-700" };
  if (pct >= 75) return { text: "Strong",     cls: "bg-green-100 text-green-700" };
  if (pct >= 60) return { text: "On Track",   cls: "bg-amber-100 text-amber-700" };
  if (pct >= 40) return { text: "Needs Work", cls: "bg-red-100   text-red-700"   };
  return           { text: "Off Track",  cls: "bg-red-100   text-red-700"   };
}

function Sparkline({ percentages }: { percentages: number[] }) {
  const last5 = percentages.slice(-5);
  if (last5.length === 0) return <span className="text-teal-200 text-xs">—</span>;
  const max = Math.max(...last5, 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {last5.map((v, i) => {
        const isCurrent = i === last5.length - 1;
        const h = Math.max(3, Math.round((v / max) * 24));
        return (
          <div
            key={i}
            className={`w-2 rounded-sm ${isCurrent ? "bg-teal-600" : "bg-teal-200"}`}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

interface RealtorTableProps {
  realtors: Realtor[];
}

export function RealtorTable({ realtors }: RealtorTableProps) {
  if (realtors.length === 0) {
    return (
      <div className="text-center py-12 text-teal-400 text-sm">
        No realtors yet. Add one from the dashboard.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-teal-100">
            {["Realtor", "This Week", "Trend", "Last Week", "Status", ""].map((h) => (
              <th
                key={h}
                className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-teal-400 font-medium"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {realtors.map((r) => {
            const history     = r.score_history ?? [];
            const last        = history[history.length - 1];
            const prev        = history[history.length - 2];
            const currentPct  = last?.percentage ?? 0;
            const prevPct     = prev?.percentage ?? 0;
            const { text, cls } = scoreLabel(currentPct);
            const trend       = history.map((h) => h.percentage);

            return (
              <tr
                key={r.id}
                className="border-b border-teal-50 hover:bg-teal-50 transition-colors cursor-pointer"
              >
                {/* Name / email */}
                <td className="py-3 px-4">
                  <Link href={`/coach/realtors/${r.id}`} className="block">
                    <p className="font-medium text-teal-800">{r.name}</p>
                    <p className="text-xs text-teal-400">{r.email}</p>
                  </Link>
                </td>

                {/* Score bar */}
                <td className="py-3 px-4 w-40">
                  <ScoreBar percentage={currentPct} showLabel />
                </td>

                {/* Sparkline */}
                <td className="py-3 px-4">
                  <Sparkline percentages={trend} />
                </td>

                {/* Last week % */}
                <td className="py-3 px-4 text-teal-700 font-medium">
                  {prev ? `${prevPct}%` : "—"}
                </td>

                {/* Status pill */}
                <td className="py-3 px-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
                    {text}
                  </span>
                </td>

                {/* Sheet link */}
                <td className="py-3 px-4">
                  {r.folder_url ? (
                    <a
                      href={r.folder_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-600 hover:underline whitespace-nowrap"
                    >
                      View sheet ↗
                    </a>
                  ) : (
                    <span className="text-xs text-teal-200">No sheet</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
