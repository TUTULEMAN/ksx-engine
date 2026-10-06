export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const nowIso = () => new Date().toISOString();

export function money(n: number | undefined, digits = 1): string {
  if (n === undefined || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(digits)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(digits)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

export const mult = (n: number) => `${n.toFixed(1)}x`;

export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Date-only strings (yyyy-mm-dd) are local calendar days; `new Date()` would treat them as UTC. */
export function parseDate(d: Date | string): Date {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) return fromDateInput(d);
  return new Date(d);
}

export function startOfDay(d: Date | string = new Date()): Date {
  const x = parseDate(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function toDateInput(d: Date | string): string {
  const x = new Date(d);
  const m = `${x.getMonth() + 1}`.padStart(2, '0');
  const day = `${x.getDate()}`.padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Parses a yyyy-mm-dd value as a local date (not UTC). */
export function fromDateInput(v: string): Date {
  const [y, m, d] = v.split('-').map(Number);
  return new Date(y, m - 1, d, 9, 0, 0);
}

export function daysFromToday(d: string): number {
  const ms = startOfDay(d).getTime() - startOfDay().getTime();
  return Math.round(ms / 86_400_000);
}

export function shortDate(d: string | undefined): string {
  if (!d) return '—';
  return parseDate(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function relDay(d: string): string {
  const n = daysFromToday(d);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  if (n < 0) return `${-n}d overdue`;
  if (n < 7) return `In ${n}d`;
  return shortDate(d);
}

export function timeAgo(d: string): string {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return shortDate(d);
}

export function fileSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
