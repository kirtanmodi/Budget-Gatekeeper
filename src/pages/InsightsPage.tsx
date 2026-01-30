import { useMemo, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateBudget } from '../store/budgetSlice';
import { generateSuggestions, getDecisionStats, calculatePaceProjections } from '../engine/suggestions';
import { getDaysInMonth } from '../engine/decision';
import { SuggestionCard } from '../components/SuggestionCard';
import type { Suggestion } from '../types';

export function InsightsPage() {
  const dispatch = useAppDispatch();
  const budgetState = useAppSelector((state) => state.budget);
  const { categories, decisionLogs, system } = budgetState;

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const todayDate = useMemo(() => new Date(system.today), [system.today]);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());
  const daysLeft = daysInMonth - currentDay;

  const suggestions = useMemo(
    () => generateSuggestions(budgetState).filter((s) => !dismissedIds.has(s.id)),
    [budgetState, dismissedIds]
  );

  const stats = useMemo(() => getDecisionStats(decisionLogs), [decisionLogs]);

  const projections = useMemo(
    () => calculatePaceProjections(categories, currentDay, daysInMonth),
    [categories, currentDay, daysInMonth]
  );

  const netProjection = projections.reduce(
    (sum, p) => sum + p.projectedDelta,
    0
  );

  const handleAction = (suggestion: Suggestion) => {
    if (!suggestion.action) return;

    if (suggestion.action.type === 'UPDATE_BUDGET') {
      dispatch(
        updateBudget({
          categoryId: suggestion.action.categoryId,
          newBudget: suggestion.action.amount,
        })
      );
      setDismissedIds((prev) => new Set([...prev, suggestion.id]));
    } else if (suggestion.action.type === 'REALLOCATE') {
      const { categoryId, amount, targetCategoryId } = suggestion.action;
      if (!targetCategoryId) return;

      const fromCategory = categories.find((c) => c.id === categoryId);
      const toCategory = categories.find((c) => c.id === targetCategoryId);

      if (fromCategory && toCategory) {
        dispatch(
          updateBudget({
            categoryId: categoryId,
            newBudget: fromCategory.monthlyBudget - amount,
          })
        );
        dispatch(
          updateBudget({
            categoryId: targetCategoryId,
            newBudget: toCategory.monthlyBudget + amount,
          })
        );
        setDismissedIds((prev) => new Set([...prev, suggestion.id]));
      }
    }
  };

  const handleDismiss = (suggestion: Suggestion) => {
    setDismissedIds((prev) => new Set([...prev, suggestion.id]));
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          Smart suggestions based on your spending patterns
        </p>
      </div>

      {/* Decision stats */}
      {stats.total > 0 && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">This Month's Decisions</h2>
          <div className="grid grid-cols-4 gap-1 text-center">
            <div className="p-2">
              <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="p-2">
              <p className="text-lg font-semibold text-green-600">{stats.yes}</p>
              <p className="text-xs text-gray-500">YES</p>
            </div>
            <div className="p-2">
              <p className="text-lg font-semibold text-amber-600">{stats.wait}</p>
              <p className="text-xs text-gray-500">WAIT</p>
            </div>
            <div className="p-2">
              <p className="text-lg font-semibold text-red-600">{stats.no}</p>
              <p className="text-xs text-gray-500">NO</p>
            </div>
          </div>
        </div>
      )}

      {/* Forecast - shown after day 7 for meaningful data */}
      {currentDay >= 7 && (
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">End of Month Forecast</h2>
          <div className="space-y-2">
            {projections.map((p) => (
              <div key={p.categoryId} className="flex justify-between text-sm">
                <span className="text-gray-600">{p.categoryName}</span>
                <span
                  className={
                    p.projectedDelta >= 0 ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {p.projectedDelta >= 0 ? '+' : ''}
                  {Math.round(p.projectedDelta).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-medium">
              <span className="text-gray-900">Net Projection</span>
              <span
                className={netProjection >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {netProjection >= 0 ? '+' : ''}
                {Math.round(netProjection).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Based on current pace with {daysLeft} days remaining
          </p>
        </div>
      )}

      {/* Suggestions list */}
      <div className="flex-1">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h2>

        {suggestions.length === 0 && decisionLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No suggestions yet.</p>
            <p className="text-sm mt-1">
              Add some purchases to get personalized insights.
            </p>
          </div>
        )}

        {suggestions.length === 0 && decisionLogs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">All caught up!</p>
            <p className="text-sm text-green-600 mt-1">
              No actionable suggestions right now.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onAction={suggestion.action ? handleAction : undefined}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
