"use client";

import { InitialSetupItem } from "@/lib/initial-setup-config";
import { DeadlineBadge } from "./DeadlineBadge";

interface Props {
  item: InitialSetupItem;
  isChecked: boolean;
  onToggle: (id: string) => void;
  readOnly?: boolean;
}

export function InitialSetupItemCard({ item, isChecked, onToggle, readOnly = false }: Props) {
  return (
    <div
      className={`rounded-lg border-2 bg-white p-5 shadow-sm transition-all ${
        isChecked ? "border-[#0D5C63]/30 bg-[#F0FAFA]/50" : "border-[#B2DFDB]"
      }`}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          checked={isChecked}
          disabled={readOnly}
          onChange={() => !readOnly && onToggle(item.id)}
          className="mt-1 h-5 w-5 cursor-pointer rounded border-2 border-[#0D5C63] accent-[#0D5C63] disabled:cursor-not-allowed"
          aria-label={`Mark ${item.subject} as complete`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <h3
              className={`text-base font-bold text-[#0D5C63] ${
                isChecked ? "line-through opacity-70" : ""
              }`}
            >
              {item.subject}
            </h3>
            <DeadlineBadge level={item.deadlineLevel} text={item.deadline} />
          </div>

          <p className="text-sm text-gray-600 mb-1">
            <span className="font-semibold">From:</span> {item.sender}
          </p>
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-semibold">Timing:</span> {item.timing}
          </p>

          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-800 mb-1">Why this email:</p>
            <p className="text-sm text-gray-700">{item.why}</p>
          </div>

          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-800 mb-1">What you must do:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              {item.actions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ol>
          </div>

          {item.consequence && (
            <div className="mt-3 rounded-md border-l-4 border-red-400 bg-red-50 p-3">
              <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Important</p>
              <p className="text-sm text-red-700">{item.consequence}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
