import type { DecisionLog } from '../types';

export interface MonthYear {
  year: number;
  month: number; // 0-indexed
}

export function filterLogsByMonth(
  logs: DecisionLog[],
  year: number,
  month: number
): DecisionLog[] {
  return logs.filter((log) => {
    const d = new Date(log.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function calculateSpentByCategory(
  logs: DecisionLog[]
): Map<string, number> {
  const spent = new Map<string, number>();
  for (const log of logs) {
    spent.set(log.categoryId, (spent.get(log.categoryId) ?? 0) + log.amount);
  }
  return spent;
}

export function getEarliestLogMonth(logs: DecisionLog[]): MonthYear | null {
  if (logs.length === 0) return null;

  let earliest = new Date(logs[0].date);
  for (const log of logs) {
    const d = new Date(log.date);
    if (d < earliest) earliest = d;
  }

  return { year: earliest.getFullYear(), month: earliest.getMonth() };
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export function isSameMonth(a: MonthYear, b: MonthYear): boolean {
  return a.year === b.year && a.month === b.month;
}

export function getPrevMonth(m: MonthYear): MonthYear {
  if (m.month === 0) {
    return { year: m.year - 1, month: 11 };
  }
  return { year: m.year, month: m.month - 1 };
}

export function getNextMonth(m: MonthYear): MonthYear {
  if (m.month === 11) {
    return { year: m.year + 1, month: 0 };
  }
  return { year: m.year, month: m.month + 1 };
}

export function isAfterMonth(a: MonthYear, b: MonthYear): boolean {
  if (a.year > b.year) return true;
  if (a.year < b.year) return false;
  return a.month > b.month;
}

export function isBeforeMonth(a: MonthYear, b: MonthYear): boolean {
  if (a.year < b.year) return true;
  if (a.year > b.year) return false;
  return a.month < b.month;
}
