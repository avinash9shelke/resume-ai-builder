"use client";

import type { InputHTMLAttributes } from "react";

export interface InlineTextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** When true, sizes the input to its content instead of filling the row (for short inline values). */
  autoWidth?: boolean;
}

/**
 * A borderless, background-less input styled to look like plain text until
 * focused — the building block for WYSIWYG-style "click directly on the
 * resume to edit" sections (see ProfileCard).
 */
export function InlineTextInput({ autoWidth, className = "", style, value, placeholder, ...props }: InlineTextInputProps) {
  const widthStyle = autoWidth
    ? { width: `${Math.max(String(value ?? "").length, (placeholder ?? "").length, 1) + 1}ch`, ...style }
    : style;

  return (
    <input
      value={value}
      placeholder={placeholder}
      style={widthStyle}
      className={`rounded border border-transparent bg-transparent px-1 py-0.5 outline-none transition-colors placeholder:text-gray-300 hover:border-gray-200 focus:border-blue-300 focus:bg-blue-50/40 ${className}`}
      {...props}
    />
  );
}
