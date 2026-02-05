import type { Decision, ContextInfo } from '../types';

export function calculateDecision(
  categoryBudget: number,
  spentSoFar: number,
  newAmount: number,
  currentDay: number,
  daysInMonth: number
): Decision {
  const total = spentSoFar + newAmount;
  const graceLimit = categoryBudget * 0.6;

  // Time-weighted: 50% allowed on day 1, scaling to 100% by month end
  const progress = currentDay / daysInMonth;
  const expectedRatio = 0.5 + 0.5 * progress;
  const expectedSpend = categoryBudget * expectedRatio;

  const graceAvailable = spentSoFar < graceLimit;
  const usedPercent = categoryBudget > 0 ? Math.round((total / categoryBudget) * 100) : 0;
  const allowedPercent = Math.round(expectedRatio * 100);

  if (graceAvailable && total <= graceLimit) {
    return {
      type: 'YES',
      reason: { code: 'GRACE', usedPercent },
    };
  }

  if (total <= expectedSpend) {
    return {
      type: 'YES',
      reason: { code: 'ON_PACE', allowedPercent },
    };
  }

  if (total <= categoryBudget) {
    const waitUntilDay = daysInMonth * (2 * total / categoryBudget - 1);
    const waitDays = Math.ceil(waitUntilDay) - currentDay;
    return {
      type: 'WAIT',
      days: waitDays,
      reason: { code: 'OVER_PACE', allowedPercent, totalPercent: usedPercent },
    };
  }

  return {
    type: 'NO',
    reason: { code: 'OVER_BUDGET' },
  };
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

export type Zone = 'FREE' | 'CONTROL' | 'STOP';

export function getZone(spent: number, budget: number): Zone {
  if (budget <= 0) return 'STOP';
  const percent = (spent / budget) * 100;
  if (percent <= 60) return 'FREE';
  if (percent <= 100) return 'CONTROL';
  return 'STOP';
}
