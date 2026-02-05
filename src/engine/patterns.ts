import type { DecisionLog, SpendingPattern } from '../types';

const MIN_DATA_POINTS = 10;
const MIN_MONTHS_FOR_PATTERNS = 3;

function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDayOfMonth(dateStr: string): number {
  return new Date(dateStr).getDate();
}

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function getUniqueMonths(logs: DecisionLog[]): Set<string> {
  const months = new Set<string>();
  for (const log of logs) {
    months.add(getMonthKey(log.date));
  }
  return months;
}

export function hasEnoughData(logs: DecisionLog[]): boolean {
  const months = getUniqueMonths(logs);
  return months.size >= MIN_MONTHS_FOR_PATTERNS && logs.length >= MIN_DATA_POINTS;
}

export function analyzePatterns(logs: DecisionLog[]): SpendingPattern[] {
  const categoryLogs = new Map<string, DecisionLog[]>();

  for (const log of logs) {
    if (!categoryLogs.has(log.categoryId)) {
      categoryLogs.set(log.categoryId, []);
    }
    categoryLogs.get(log.categoryId)!.push(log);
  }

  const patterns: SpendingPattern[] = [];

  for (const [categoryId, catLogs] of categoryLogs) {
    if (catLogs.length < MIN_DATA_POINTS) continue;

    const weekdayAmounts: number[] = [];
    const weekendAmounts: number[] = [];
    const firstWeekAmounts: number[] = [];
    const midMonthAmounts: number[] = [];
    const endMonthAmounts: number[] = [];
    const allAmounts: number[] = [];

    for (const log of catLogs) {
      const amount = log.amount;
      allAmounts.push(amount);

      if (isWeekend(log.date)) {
        weekendAmounts.push(amount);
      } else {
        weekdayAmounts.push(amount);
      }

      const dayOfMonth = getDayOfMonth(log.date);
      if (dayOfMonth <= 7) {
        firstWeekAmounts.push(amount);
      } else if (dayOfMonth <= 21) {
        midMonthAmounts.push(amount);
      } else {
        endMonthAmounts.push(amount);
      }
    }

    const weekdayAvg = calculateMean(weekdayAmounts);
    const weekendAvg = calculateMean(weekendAmounts);
    const firstWeekAvg = calculateMean(firstWeekAmounts);
    const midMonthAvg = calculateMean(midMonthAmounts);
    const endMonthAvg = calculateMean(endMonthAmounts);

    const mean = calculateMean(allAmounts);
    const stdDev = calculateStdDev(allAmounts);
    const volatility = mean > 0 ? stdDev / mean : 0;

    patterns.push({
      categoryId,
      weekdayAvg,
      weekendAvg,
      firstWeekAvg,
      midMonthAvg,
      endMonthAvg,
      volatility,
    });
  }

  return patterns;
}

export function detectWeekendBias(logs: DecisionLog[]): number {
  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (const log of logs) {
    if (isWeekend(log.date)) {
      weekendTotal += log.amount;
      weekendCount++;
    } else {
      weekdayTotal += log.amount;
      weekdayCount++;
    }
  }

  const weekdayAvg = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;
  const weekendAvg = weekendCount > 0 ? weekendTotal / weekendCount : 0;

  if (weekdayAvg === 0) return weekendAvg > 0 ? 2 : 1;

  return weekendAvg / weekdayAvg;
}

export function detectPaydaySpike(logs: DecisionLog[]): boolean {
  const firstWeekAmounts: number[] = [];
  const restAmounts: number[] = [];

  for (const log of logs) {
    const dayOfMonth = getDayOfMonth(log.date);
    if (dayOfMonth <= 7) {
      firstWeekAmounts.push(log.amount);
    } else {
      restAmounts.push(log.amount);
    }
  }

  const firstWeekAvg = calculateMean(firstWeekAmounts);
  const restAvg = calculateMean(restAmounts);

  if (restAvg === 0) return false;

  return firstWeekAvg / restAvg >= 1.3;
}

export function getPatternInsights(
  patterns: SpendingPattern[]
): Array<{ categoryId: string; insight: string; type: string }> {
  const insights: Array<{ categoryId: string; insight: string; type: string }> = [];

  for (const pattern of patterns) {
    if (pattern.weekendAvg > 0 && pattern.weekdayAvg > 0) {
      const weekendRatio = pattern.weekendAvg / pattern.weekdayAvg;
      if (weekendRatio >= 1.5) {
        insights.push({
          categoryId: pattern.categoryId,
          insight: `Weekend spending is ${Math.round((weekendRatio - 1) * 100)}% higher than weekdays`,
          type: 'WEEKEND_PATTERN',
        });
      }
    }

    if (pattern.midMonthAvg > 0 && pattern.firstWeekAvg / pattern.midMonthAvg >= 1.3) {
      insights.push({
        categoryId: pattern.categoryId,
        insight: 'Higher spending in the first week of the month',
        type: 'PAYDAY_SPIKE',
      });
    }

    if (pattern.volatility > 1) {
      insights.push({
        categoryId: pattern.categoryId,
        insight: 'Highly variable spending - consider setting aside a buffer',
        type: 'HIGH_VOLATILITY',
      });
    }
  }

  return insights;
}
