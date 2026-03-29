// src/components/metric-card.tsx

import { cn } from "@/lib/utils";

const pillColors = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  teal:  "bg-teal-100  text-teal-600",
} as const;

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?:  string;
  sub?:   string;
  pill?:  { text: string; color: keyof typeof pillColors };
}

export function MetricCard({ label, value, unit, sub, pill }: MetricCardProps) {
  return (
    <div className="bg-white border border-teal-200 rounded-xl p-5">
      <p className="text-[10px] uppercase tracking-widest text-teal-400 mb-2 font-medium">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-medium text-teal-800">{value}</span>
        {unit && <span className="text-sm text-teal-400">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-teal-400 mt-1">{sub}</p>}
      {pill && (
        <span
          className={cn(
            "inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium",
            pillColors[pill.color]
          )}
        >
          {pill.text}
        </span>
      )}
    </div>
  );
}
