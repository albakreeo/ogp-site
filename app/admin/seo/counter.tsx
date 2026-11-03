"use client";

import { useState } from "react";

/** Textarea with a live character counter (SEO titles ~60, descriptions ~160). */
export function Field({
  name,
  label,
  defaultValue,
  placeholder,
  rows = 2,
  hint,
  max,
  rtl = false,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  rows?: number;
  hint?: number;
  max: number;
  rtl?: boolean;
}) {
  const [len, setLen] = useState(defaultValue.length);
  const over = hint !== undefined && len > hint;
  return (
    <label className="fld">
      <span className="fld-top">
        <span>{label}</span>
        <span className={over ? "cnt warn" : "cnt"}>
          {len}
          {hint ? ` / ${hint}` : ""}
        </span>
      </span>
      <textarea
        name={name}
        rows={rows}
        maxLength={max}
        defaultValue={defaultValue}
        placeholder={placeholder}
        dir={rtl ? "rtl" : "ltr"}
        onChange={(e) => setLen(e.target.value.length)}
      />
    </label>
  );
}
