"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

function parseYearMonth(value: string): { year: number | null; month: number | null } {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return { year: null, month: null };
  return { year: Number(match[1]), month: Number(match[2]) };
}

/**
 * "From / To" year+month range picker (design reference: user-provided
 * screenshot). Replaces the native <input type="date"> for RichTextEntry
 * dates, storing values as "YYYY-MM".
 */
export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [activeField, setActiveField] = useState<"from" | "to">("from");
  const currentValue = activeField === "from" ? from : to;
  const parsed = parseYearMonth(currentValue);
  const currentYear = new Date().getFullYear();
  const [decadeStart, setDecadeStart] = useState(
    () => Math.floor((parsed.year ?? currentYear) / 10) * 10,
  );
  const [pendingYear, setPendingYear] = useState<number | null>(parsed.year);

  function switchField(field: "from" | "to") {
    setActiveField(field);
    const value = field === "from" ? from : to;
    const p = parseYearMonth(value);
    setPendingYear(p.year);
    setDecadeStart(Math.floor((p.year ?? currentYear) / 10) * 10);
  }

  function selectMonth(monthIndex: number) {
    const year = pendingYear ?? currentYear;
    const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    onChange({ from: activeField === "from" ? value : from, to: activeField === "to" ? value : to });
  }

  function clearActiveField() {
    onChange({ from: activeField === "from" ? "" : from, to: activeField === "to" ? "" : to });
  }

  const years = Array.from({ length: 10 }, (_, i) => decadeStart + i);

  return (
    <div className="w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <div className="mb-2 grid grid-cols-2 text-sm font-semibold">
        <button
          type="button"
          onClick={() => switchField("from")}
          className={`rounded-t-md border-b-2 py-1 ${
            activeField === "from" ? "border-emerald-500 text-gray-900" : "border-transparent text-gray-400"
          }`}
        >
          From
        </button>
        <button
          type="button"
          onClick={() => switchField("to")}
          className={`rounded-t-md border-b-2 py-1 ${
            activeField === "to" ? "border-emerald-500 text-gray-900" : "border-transparent text-gray-400"
          }`}
        >
          To
        </button>
      </div>

      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous decade"
          onClick={() => setDecadeStart((d) => d - 10)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-500">
          {decadeStart} - {decadeStart + 9}
        </span>
        <button
          type="button"
          aria-label="Next decade"
          onClick={() => setDecadeStart((d) => d + 10)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3 grid grid-cols-4 gap-1">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => setPendingYear(year)}
            className={`rounded-md px-1.5 py-1 text-xs ${
              pendingYear === year
                ? "border border-emerald-400 font-semibold text-emerald-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {year}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1">
        {MONTHS.map((label, i) => {
          const isSelected = parsed.year === pendingYear && parsed.month === i + 1;
          return (
            <button
              key={label}
              type="button"
              onClick={() => selectMonth(i)}
              className={`rounded-md px-2 py-1.5 text-xs ${
                isSelected
                  ? "border border-emerald-400 font-semibold text-emerald-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {currentValue && (
        <button
          type="button"
          onClick={clearActiveField}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600"
        >
          Clear {activeField}
        </button>
      )}
    </div>
  );
}
