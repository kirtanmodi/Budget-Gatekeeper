import type { Category, DecisionLog, PredictiveAlert, SpendingPattern, BudgetState } from '../types';
import { analyzePatterns, hasEnoughData } from './patterns';
import { getDaysInMonth } from './decision';

function isWeekend(day: number, month: number, year: number): boolean {
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function countWeekendDays(fromDay: number, toDay: number, month: number, year: number): number {
  let count = 0;
  for (let day = fromDay; day <= toDay; day++) {
    if (isWeekend(day, month, year)) {
      count++;
    }
  }
  return count;
}

export function projectWithPatterns(
  _category: Category,
  pattern: SpendingPattern | undefined,
  currentDay: number,
  daysInMonth: number,
  currentSpent: number,
  today: Date
): number {
  const month = today.getMonth();
  const year = today.getFullYear();

  if (!pattern || currentDay <= 0) {
    const dailyBurnRate = currentSpent / currentDay;
    return dailyBurnRate * daysInMonth;
  }

  const remainingDays = daysInMonth - currentDay;
  const weekendDaysRemaining = countWeekendDays(currentDay + 1, daysInMonth, month, year);
  const weekdayDaysRemaining = remainingDays - weekendDaysRemaining;

  const hasWeekendPattern = pattern.weekdayAvg > 0 && pattern.weekendAvg > 0;

  let projectedRemainingSpend: number;

  if (hasWeekendPattern) {
    projectedRemainingSpend =
      weekdayDaysRemaining * (pattern.weekdayAvg / 5) +
      weekendDaysRemaining * (pattern.weekendAvg / 2);
  } else {
    const dailyBurnRate = currentSpent / currentDay;
    projectedRemainingSpend = dailyBurnRate * remainingDays;
  }

  return currentSpent + projectedRemainingSpend;
}

export function calculateOverspendDate(
  budget: number,
  currentSpent: number,
  dailyRate: number,
  currentDay: number,
  daysInMonth: number
): string | null {
  if (dailyRate <= 0) return null;

  const remaining = budget - currentSpent;
  if (remaining <= 0) return 'Already over budget';

  const daysUntilBudgetExhausted = remaining / dailyRate;
  const overspendDay = Math.floor(currentDay + daysUntilBudgetExhausted);

  if (overspendDay > daysInMonth) return null;

  return `Day ${overspendDay}`;
}

export function generatePredictiveAlerts(
  state: BudgetState,
  archivedLogs: DecisionLog[] = []
): PredictiveAlert[] {
  const { categories, decisionLogs, system } = state;
  const alerts: PredictiveAlert[] = [];

  const todayDate = new Date(system.today);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());

  if (currentDay < 3) return alerts;

  const allLogs = [...archivedLogs, ...decisionLogs];
  const patterns = hasEnoughData(allLogs) ? analyzePatterns(allLogs) : [];

  for (const category of categories) {
    const pattern = patterns.find((p) => p.categoryId === category.id);
    const budget = category.monthlyBudget;
    const spent = category.currentSpent;

    const projectedEndSpend = projectWithPatterns(
      category,
      pattern,
      currentDay,
      daysInMonth,
      spent,
      todayDate
    );

    const overBudgetAmount = projectedEndSpend - budget;
    const overBudgetPercent = budget > 0 ? (overBudgetAmount / budget) * 100 : 0;

    if (overBudgetAmount > 0) {
      const dailyRate = spent / currentDay;
      const overspendDate = calculateOverspendDate(
        budget,
        spent,
        dailyRate,
        currentDay,
        daysInMonth
      );

      let severity: 'info' | 'warning' | 'critical' = 'info';
      if (overBudgetPercent >= 25) {
        severity = 'critical';
      } else if (overBudgetPercent >= 10) {
        severity = 'warning';
      }

      let alertType: 'OVERSPEND_WARNING' | 'PAYDAY_SPIKE' | 'WEEKEND_PATTERN' = 'OVERSPEND_WARNING';
      let message = `Projected to overspend by ${Math.round(overBudgetPercent)}%`;

      if (pattern) {
        const weekendRatio = pattern.weekdayAvg > 0 ? pattern.weekendAvg / pattern.weekdayAvg : 1;
        const paydayRatio = pattern.midMonthAvg > 0 ? pattern.firstWeekAvg / pattern.midMonthAvg : 1;

        if (weekendRatio >= 1.5) {
          alertType = 'WEEKEND_PATTERN';
          message = `Weekend spending is driving overspend - projected ${Math.round(overBudgetPercent)}% over`;
        } else if (paydayRatio >= 1.3 && currentDay <= 10) {
          alertType = 'PAYDAY_SPIKE';
          message = `Payday spending spike detected - projected ${Math.round(overBudgetPercent)}% over`;
        }
      }

      if (overspendDate && overspendDate !== 'Already over budget') {
        message += ` by ${overspendDate}`;
      }

      alerts.push({
        id: `alert-${category.id}-${currentDay}`,
        categoryId: category.id,
        type: alertType,
        predictedOverspendDate: overspendDate,
        predictedOverspendAmount: Math.round(overBudgetAmount),
        message,
        severity,
      });
    }
  }

  alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return alerts;
}
