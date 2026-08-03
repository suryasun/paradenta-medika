const FORMULA_PREFIXES = ['=', '+', '-', '@'];

/** docs/03-sad/20-module-report.md Section 10.3/TC-RPT-014: spreadsheet formula-injection protection -- a cell whose content begins with =, +, -, or @ is prefixed with a single quote so spreadsheet software renders it as literal text rather than executing it. */
function sanitizeCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const sanitized = FORMULA_PREFIXES.some((prefix) => raw.startsWith(prefix)) ? `'${raw}` : raw;
  if (/[",\n]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/** Reports return heterogeneous shapes (bare arrays, `{ items, total }` paged results, or the dashboard-style `{ metrics: [...] }` envelope) -- this extracts the row set common to all of them. */
function extractRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload as Array<Record<string, unknown>>;
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as Array<Record<string, unknown>>;
    if (Array.isArray(obj.metrics)) return obj.metrics as Array<Record<string, unknown>>;
    return [obj];
  }
  return [];
}

export function toSanitizedCsv(payload: unknown): string {
  const rows = extractRows(payload);
  if (rows.length === 0) {
    return '';
  }
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => sanitizeCell(row[column])).join(','));
  }
  return lines.join('\n');
}
