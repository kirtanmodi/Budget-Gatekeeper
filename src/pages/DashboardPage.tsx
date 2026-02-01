import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { getEffectiveBudget } from '../store/budgetSlice';
import { getDaysInMonth, getZone } from '../engine/decision';
import { generateSuggestions } from '../engine/suggestions';
import { zoneLabels, zoneStyles } from '../constants/zones';
import { formatCurrency, pluralize } from '../utils/format';
import { getTotalBudget, getTotalSpent } from '../utils/budget';

export function DashboardPage() {
  const budgetState = useAppSelector((state) => state.budget);
  const { categories, system } = budgetState;
  const today = system.today;
  const todayDate = useMemo(() => new Date(today), [today]);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());
  const daysLeft = daysInMonth - currentDay;

  const totalBudget = getTotalBudget(categories);
  const totalSpent = getTotalSpent(categories);
  const totalRemaining = totalBudget - totalSpent;

  const suggestions = useMemo(
    () => generateSuggestions(budgetState),
    [budgetState]
  );
  const actionableSuggestions = suggestions.filter(
    (s) => s.severity === 'warning' || s.action
  );

  const formattedDate = todayDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formattedDate} — {daysLeft} {pluralize(daysLeft, 'day')} left
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Spent</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={`text-lg font-semibold ${totalRemaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>
      </div>

      {actionableSuggestions.length > 0 && (
        <Link
          to="/insights"
          className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6"
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="text-sm font-medium text-amber-800">
              {actionableSuggestions.length} {pluralize(actionableSuggestions.length, 'suggestion')} for you
            </span>
          </div>
          <svg
            className="w-4 h-4 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}

      <div className="flex-1 space-y-3">
        {categories.map((category) => {
          const effectiveBudget = getEffectiveBudget(category);
          const zone = getZone(category.currentSpent, effectiveBudget);
          const percent = effectiveBudget > 0
            ? Math.min(100, (category.currentSpent / effectiveBudget) * 100)
            : 0;
          const remaining = effectiveBudget - category.currentSpent;
          const hasTemporaryAdjustment = category.temporaryAdjustment !== undefined && category.temporaryAdjustment !== 0;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{category.name}</p>
                <span className={`px-2 py-1 text-xs font-medium rounded ${zoneStyles[zone].badge}`}>
                  {zoneLabels[zone]}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{formatCurrency(category.currentSpent)} spent</span>
                <span className={remaining < 0 ? 'text-red-600' : ''}>
                  {formatCurrency(remaining)} left
                </span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${zoneStyles[zone].bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2 text-right">
                of {formatCurrency(effectiveBudget)}
                {hasTemporaryAdjustment && (
                  <span className="text-blue-500 ml-1">(adjusted this month)</span>
                )}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
