// src/components/score-bar.tsx

interface ScoreBarProps {
  percentage:  number;
  showLabel?:  boolean;
}

export function ScoreBar({ percentage, showLabel = false }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-teal-100 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-teal-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-teal-600 font-medium w-9 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
