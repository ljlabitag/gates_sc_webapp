function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// UTF-8 BOM prefix so Excel (which doesn't assume UTF-8 without it) renders
// non-ASCII characters correctly instead of mangling them — part of the
// brief's acceptance check that exports "open cleanly in Excel."
const UTF8_BOM = "﻿";

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T & string)[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((col) => escapeCell(row[col])).join(","));
  return UTF8_BOM + [header, ...lines].join("\r\n") + "\r\n";
}
