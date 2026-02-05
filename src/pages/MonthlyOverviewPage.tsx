import { useState, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { getDaysInMonth } from '../engine/decision';
import { formatCurrency, formatCompactCurrency } from '../utils/format';
import { getTotalBudget } from '../utils/budget';
import { MonthPicker } from '../components/MonthPicker';
import {
  type MonthYear,
  filterLogsByMonth,
  calculateSpentByCategory,
  getEarliestLogMonth,
  isSameMonth,
} from '../utils/date';

export function MonthlyOverviewPage() {
  const { categories, decisionLogs, archivedLogs, system } = useAppSelector(
    (state) => state.budget
  );

  const todayDate = useMemo(() => new Date(system.today), [system.today]);
  const currentMonth: MonthYear = useMemo(
    () => ({
      year: todayDate.getFullYear(),
      month: todayDate.getMonth(),
    }),
    [todayDate]
  );

  const [viewDate, setViewDate] = useState<MonthYear>(currentMonth);
  const isCurrentMonth = isSameMonth(viewDate, currentMonth);

  const minDate = useMemo(() => {
    const earliest = getEarliestLogMonth(archivedLogs);
    return earliest || currentMonth;
  }, [archivedLogs, currentMonth]);

  const displayLogs = useMemo(() => {
    return isCurrentMonth
      ? decisionLogs
      : filterLogsByMonth(archivedLogs, viewDate.year, viewDate.month);
  }, [isCurrentMonth, decisionLogs, archivedLogs, viewDate]);

  const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
  const currentDay = isCurrentMonth ? todayDate.getDate() : daysInMonth;
  const monthProgress = (currentDay / daysInMonth) * 100;

  const monthName = new Date(viewDate.year, viewDate.month, 1).toLocaleDateString(
    'en-IN',
    { month: 'long', year: 'numeric' }
  );

  const historicalSpentMap = useMemo(() => {
    if (isCurrentMonth) return null;
    return calculateSpentByCategory(displayLogs);
  }, [isCurrentMonth, displayLogs]);

  const totalBudget = getTotalBudget(categories);
  const totalSpent = useMemo(() => {
    if (isCurrentMonth) {
      return categories.reduce((sum, c) => sum + c.currentSpent, 0);
    }
    return displayLogs.reduce((sum, log) => sum + log.amount, 0);
  }, [isCurrentMonth, categories, displayLogs]);

  const totalRemaining = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const dailySpending = useMemo(() => {
    const days: { date: string; amount: number; label: string }[] = [];

    const endDay = isCurrentMonth ? todayDate.getDate() : daysInMonth;
    const startDay = Math.max(1, endDay - 6);

    for (let day = startDay; day <= endDay; day++) {
      const date = new Date(viewDate.year, viewDate.month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short' });

      const dayTotal = displayLogs
        .filter((log) => log.date === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);

      days.push({ date: dateStr, amount: dayTotal, label: dayLabel });
    }

    return days;
  }, [displayLogs, viewDate, isCurrentMonth, todayDate, daysInMonth]);

  const maxDailySpend = Math.max(...dailySpending.map((d) => d.amount), 1);
  const avgDailySpend =
    dailySpending.length > 0
      ? dailySpending.reduce((sum, d) => sum + d.amount, 0) / dailySpending.length
      : 0;

  const stats = useMemo(() => {
    const transactionCount = displayLogs.length;
    const avgPerTransaction =
      transactionCount > 0 ? totalSpent / transactionCount : 0;

    const spendingByDate = displayLogs.reduce(
      (acc, log) => {
        acc[log.date] = (acc[log.date] || 0) + log.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    let peakDay = '';
    let peakAmount = 0;
    for (const [date, amount] of Object.entries(spendingByDate)) {
      if (amount > peakAmount) {
        peakAmount = amount;
        peakDay = date;
      }
    }

    const peakDayFormatted = peakDay
      ? new Date(peakDay).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        })
      : '-';

    return {
      transactionCount,
      avgPerTransaction,
      peakDay: peakDayFormatted,
      peakAmount,
    };
  }, [displayLogs, totalSpent]);

  const categoryBreakdown = useMemo(() => {
    return [...categories]
      .map((c) => {
        const budget = c.monthlyBudget;
        const spent = isCurrentMonth
          ? c.currentSpent
          : historicalSpentMap?.get(c.id) ?? 0;
        return {
          ...c,
          spent,
          budget,
          percent: budget > 0 ? (spent / budget) * 100 : 0,
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [categories, historicalSpentMap, isCurrentMonth]);

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Monthly Overview</h1>
        <MonthPicker
          value={viewDate}
          onChange={setViewDate}
          minDate={minDate}
          maxDate={currentMonth}
        />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-lg font-medium text-gray-900">{monthName}</span>
          <span className="text-sm text-gray-500">
            {isCurrentMonth ? `Day ${currentDay}/${daysInMonth}` : 'Completed'}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-400 rounded-full transition-all"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Budget Summary</h2>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalBudget)}
            </p>
            <p className="text-xs text-gray-500">Budget</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-gray-500">Spent</p>
          </div>
          <div>
            <p
              className={`text-lg font-semibold ${
                totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(Math.abs(totalRemaining))}
            </p>
            <p className="text-xs text-gray-500">
              {totalRemaining >= 0 ? 'Left' : 'Over'}
            </p>
          </div>
        </div>
        <div className="h-3 bg-gray-300 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              spentPercent > 100
                ? 'bg-red-500'
                : spentPercent > 80
                  ? 'bg-amber-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 text-center mt-1">
          {spentPercent.toFixed(0)}% used
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-4">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Category Breakdown
        </h2>
        <div className="space-y-3">
          {categoryBreakdown.map((category) => (
            <div key={category.id}>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-700 truncate flex-1">
                  {category.name}
                </span>
                <span className="text-gray-500 ml-2">
                  {formatCompactCurrency(category.spent)} /{' '}
                  {formatCompactCurrency(category.budget)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      category.percent > 100
                        ? 'bg-red-500'
                        : category.percent > 80
                          ? 'bg-amber-500'
                          : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(category.percent, 100)}%` }}
                  />
                </div>
                <span
                  className={`text-xs w-10 text-right ${
                    category.percent > 100
                      ? 'text-red-600'
                      : category.percent > 80
                        ? 'text-amber-600'
                        : 'text-gray-500'
                  }`}
                >
                  {category.percent.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {dailySpending.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Daily Spending {isCurrentMonth ? '(Last 7 Days)' : '(Last Week)'}
          </h2>
          <div className="flex items-end justify-between h-20 gap-1">
            {dailySpending.map((day) => {
              const height =
                day.amount > 0 ? (day.amount / maxDailySpend) * 100 : 4;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t transition-all ${
                      day.amount > 0 ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {dailySpending.map((day) => (
              <span
                key={day.date}
                className="flex-1 text-xs text-gray-500 text-center"
              >
                {day.label}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            {formatCompactCurrency(avgDailySpend)} avg/day
          </p>
        </div>
      )}

      {displayLogs.length > 0 && (
        <div className="bg-gray-100 rounded-lg p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Key Stats</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">
                {stats.transactionCount}
              </p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">
                {formatCompactCurrency(stats.avgPerTransaction)}
              </p>
              <p className="text-xs text-gray-500">Avg/txn</p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-lg font-semibold text-gray-900">{stats.peakDay}</p>
              <p className="text-xs text-gray-500">Peak day</p>
            </div>
          </div>
        </div>
      )}

      {displayLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No transactions {isCurrentMonth ? 'this month yet' : 'in this month'}.</p>
          {isCurrentMonth && (
            <p className="text-sm mt-1">
              Start logging purchases to see your overview.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
