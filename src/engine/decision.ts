import type { Decision, ContextInfo } from '../types';

export function calculateDecision(
  categoryBudget: number,
  spentSoFar: number,
  newAmount: number,
  currentDay: number,
  daysInMonth: number
): Decision {
  const total = spentSoFar + newAmount;
  const graceLimit = categoryBudget * 0.8;
  const dailyAllowance = categoryBudget / daysInMonth;
  const expectedSpend = dailyAllowance * currentDay;

  const graceAvailable = spentSoFar < graceLimit;

  if (graceAvailable && total <= graceLimit) {
    return { type: 'YES' };
  }

  if (total <= expectedSpend) {
    return { type: 'YES' };
  }

  if (total <= categoryBudget) {
    const requiredDay = Math.ceil(total / dailyAllowance);
    const waitDays = Math.max(0, requiredDay - currentDay);
    return { type: 'WAIT', days: waitDays };
  }

  return { type: 'NO' };
}

export function calculateContext(
  categoryBudget: number,
  spentSoFar: number,
  currentDay: number,
  daysInMonth: number
): ContextInfo {
  const usedPercent = categoryBudget > 0 ? (spentSoFar / categoryBudget) * 100 : 0;
  const daysLeft = Math.max(1, daysInMonth - currentDay);
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const remaining = categoryBudget - spentSoFar;
  const remainingPerWeek = remaining / weeksLeft;
  const remainingPerDay = remaining / daysLeft;

  return {
    usedPercent,
    weeksLeft,
    daysLeft,
    remainingPerWeek,
    remainingPerDay,
    spent: spentSoFar,
    budget: categoryBudget,
    remaining,
  };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
