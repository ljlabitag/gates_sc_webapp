function escapeCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T & string)[]): string {
  const header = columns.join(",");
  const lines = rows.map((row) => columns.map((col) => escapeCell(row[col])).join(","));
  return [header, ...lines].join("\r\n") + "\r\n";
}
