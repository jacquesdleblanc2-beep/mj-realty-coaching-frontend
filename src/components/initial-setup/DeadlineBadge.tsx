import { DeadlineLevel } from "@/lib/initial-setup-config";

interface Props {
  level: DeadlineLevel;
  text: string | null;
}

export function DeadlineBadge({ level, text }: Props) {
  if (level === "none" || !text) return null;

  const styles: Record<Exclude<DeadlineLevel, "none">, string> = {
    critical: "bg-red-100 text-red-700 border-red-300",
    urgent:   "bg-orange-100 text-orange-700 border-orange-300",
    warning:  "bg-yellow-100 text-yellow-800 border-yellow-300",
    info:     "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${styles[level]}`}
    >
      ⏰ {text}
    </span>
  );
}
