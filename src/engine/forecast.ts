import type { Category, DecisionLog, ForecastData, ForecastDataPoint } from '../types';

export function generateForecastData(
  categories: Category[],
  decisionLogs: DecisionLog[],
  currentDay: number,
  daysInMonth: number
): ForecastData {
  const totalBudget = categories.reduce(
    (sum, c) => sum + c.monthlyBudget,
    0
  );
  const totalSpent = categories.reduce(
    (sum, c) => sum + c.currentSpent,
    0
  );

  const spendByDay = new Map<number, number>();
  for (const log of decisionLogs) {
    if (log.decision === 'YES') {
      const logDay = new Date(log.date).getDate();
      spendByDay.set(logDay, (spendByDay.get(logDay) || 0) + log.amount);
    }
  }

  const dailyBurnRate = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedEndSpend = dailyBurnRate * daysInMonth;

  const points: ForecastDataPoint[] = [];
  let cumulativeActual = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dailyBudget = (totalBudget / daysInMonth) * day;

    if (day <= currentDay) {
      cumulativeActual += spendByDay.get(day) || 0;
      points.push({
        day,
        actual: cumulativeActual,
        projected: cumulativeActual,
        budget: dailyBudget,
      });
    } else {
      const projectedCumulative = totalSpent + dailyBurnRate * (day - currentDay);
      points.push({
        day,
        actual: null,
        projected: projectedCumulative,
        budget: dailyBudget,
      });
    }
  }

  return {
    points,
    totalBudget,
    currentDay,
    daysInMonth,
    projectedEndSpend,
    isOverspending: projectedEndSpend > totalBudget,
  };
}
