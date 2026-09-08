"use client";

import { useState, type ReactNode } from "react";

export interface SectionCardAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export interface SectionCardChromeProps {
  actions: SectionCardAction[];
  children: ReactNode;
  /** Renders below the action pill, next to it (e.g. a dropdown menu). */
  menu?: ReactNode;
}

/**
 * Shared "WYSIWYG card" chrome: a floating pill of icon actions centered
 * above the card, and a card body that highlights with an accent border on
 * focus/hover. Meant to be reused across sections as they migrate to inline
 * editing (see ProfileCard for the first usage, on Basics).
 */
export function SectionCardChrome({ actions, children, menu }: SectionCardChromeProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className="relative pt-5"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => setFocused(false)}
    >
      <div className="absolute left-1/2 top-0 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white p-1 shadow-md ring-1 ring-gray-200">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            aria-label={action.label}
            title={action.label}
            onClick={action.onClick}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {action.icon}
          </button>
        ))}
      </div>
      {menu}

      <div
        className={`rounded-lg border bg-white p-6 shadow-sm transition-colors ${
          focused ? "border-blue-400 ring-1 ring-blue-400" : "border-gray-200"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
