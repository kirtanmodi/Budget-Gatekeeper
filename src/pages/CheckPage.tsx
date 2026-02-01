import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logDecision, setLastUsedCategory, undoLastDecision, getEffectiveBudget } from '../store/budgetSlice';
import { ExpenseForm } from '../components/ExpenseForm';
import { ContextMessage } from '../components/ContextMessage';
import { DecisionResult } from '../components/DecisionResult';
import { PostDecisionActions } from '../components/PostDecisionActions';
import { UndoToast } from '../components/UndoToast';
import { calculateDecision, calculateContext, getDaysInMonth } from '../engine/decision';
import { triggerHaptic } from '../utils/haptics';
import { formatCurrency, pluralize } from '../utils/format';
import type { Decision } from '../types';

type FlowState = 'input' | 'result' | 'success';

export function CheckPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const today = useAppSelector((state) => state.budget.system.today);
  const lastUsedCategoryId = useAppSelector((state) => state.budget.lastUsedCategoryId);

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showSkipToast, setShowSkipToast] = useState(false);
  const [successData, setSuccessData] = useState<{
    categoryName: string;
    remaining: number;
    effectiveBudget: number;
    daysLeft: number;
    dailyAllowance: number;
  } | null>(null);

  const touchStartX = useRef<number>(0);

  const todayDate = useMemo(() => new Date(today), [today]);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  const context = useMemo(() => {
    if (!selectedCategory) return null;
    return calculateContext(
      getEffectiveBudget(selectedCategory),
      selectedCategory.currentSpent,
      currentDay,
      daysInMonth
    );
  }, [selectedCategory, currentDay, daysInMonth]);

  const handleCheck = (categoryId: string, checkAmount: number) => {
    setSelectedCategoryId(categoryId);
    setAmount(checkAmount);
    setShowDetails(false);

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const result = calculateDecision(
      getEffectiveBudget(category),
      category.currentSpent,
      checkAmount,
      currentDay,
      daysInMonth
    );

    setDecision(result);
    setFlowState('result');

    dispatch(setLastUsedCategory(categoryId));

    if (result.type === 'YES') {
      triggerHaptic('success');
    } else if (result.type === 'WAIT') {
      triggerHaptic('warning');
    } else {
      triggerHaptic('error');
    }
  };

  const handleBought = () => {
    if (!selectedCategoryId || !decision) return;

    const category = categories.find((c) => c.id === selectedCategoryId);
    if (!category) return;

    const categoryName = category.name;
    const effectiveBudget = getEffectiveBudget(category);
    const newSpent = category.currentSpent + amount;
    const newRemaining = effectiveBudget - newSpent;
    const newDailyAllowance = daysLeft > 0 ? newRemaining / daysLeft : 0;

    dispatch(
      logDecision({
        categoryId: selectedCategoryId,
        amount,
        decision: decision.type,
        waitDays: decision.type === 'WAIT' ? decision.days : undefined,
      })
    );

    setSuccessData({
      categoryName,
      remaining: newRemaining,
      effectiveBudget,
      daysLeft,
      dailyAllowance: newDailyAllowance,
    });
    setUndoMessage(`Bought ${formatCurrency(amount)} in ${categoryName}`);
    setShowUndo(true);
    setFlowState('success');
    triggerHaptic('success');
  };

  const handleSkipped = () => {
    setShowSkipToast(true);
    resetFlow();
  };

  const handleUndo = useCallback(() => {
    dispatch(undoLastDecision());
    setShowUndo(false);
  }, [dispatch]);

  const handleUndoDismiss = useCallback(() => {
    setShowUndo(false);
  }, []);

  const resetFlow = () => {
    setFlowState('input');
    setSelectedCategoryId(null);
    setAmount(0);
    setDecision(null);
    setShowDetails(false);
    setSuccessData(null);
  };

  useEffect(() => {
    if (showSkipToast) {
      const timer = setTimeout(() => {
        setShowSkipToast(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSkipToast]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 100) {
      handleBought();
    } else if (delta < -100) {
      handleSkipped();
    }
  };

  const formattedDate = todayDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const remainingBefore = context?.remaining ?? 0;
  const remainingAfter = remainingBefore - amount;
  const daysLeft = context?.daysLeft ?? 1;
  const dailyAfter = remainingAfter / daysLeft;
  const effectiveBudgetForResult = selectedCategory ? getEffectiveBudget(selectedCategory) : 0;
  const usedPercentBefore = effectiveBudgetForResult > 0 ? ((effectiveBudgetForResult - remainingBefore) / effectiveBudgetForResult) * 100 : 0;
  const usedPercentAfter = effectiveBudgetForResult > 0 ? ((effectiveBudgetForResult - remainingAfter) / effectiveBudgetForResult) * 100 : 0;

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Check Purchase</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formattedDate} — Day {currentDay} of {daysInMonth}
        </p>
      </div>

      {flowState === 'input' && (
        <ExpenseForm
          categories={categories}
          today={today}
          onCheck={handleCheck}
          lastUsedCategoryId={lastUsedCategoryId}
        />
      )}

      {flowState === 'result' && selectedCategory && context && decision && (
        <div
          className="flex flex-col gap-5"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <DecisionResult
            decision={decision}
            amount={amount}
            categoryName={selectedCategory.name}
            today={today}
          />

          <div className="bg-gray-50 rounded-xl p-5">
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1 text-center">Before</p>
                <p className="text-xl font-bold text-gray-900 text-center">
                  {formatCurrency(remainingBefore)}
                </p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all ${usedPercentBefore > 100 ? 'bg-red-500' : usedPercentBefore > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, usedPercentBefore)}%` }}
                  />
                </div>
              </div>
              <div className="text-gray-400 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1 text-center">After</p>
                <p className={`text-xl font-bold text-center ${remainingAfter < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(remainingAfter)}
                </p>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full transition-all ${usedPercentAfter > 100 ? 'bg-red-500' : usedPercentAfter > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, usedPercentAfter)}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              {daysLeft} {pluralize(daysLeft, 'day')} left · {formatCurrency(dailyAfter)}/day after
            </p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2"
            aria-expanded={showDetails}
            aria-label={showDetails ? 'Hide details' : 'Show details'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <ContextMessage context={context} categoryName={selectedCategory.name} />
          )}

          <PostDecisionActions onBought={handleBought} onSkipped={handleSkipped} />

          <button
            onClick={resetFlow}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Change amount
          </button>

          <p className="text-xs text-gray-400 text-center">
            Swipe right for Bought · Swipe left for Skip
          </p>
        </div>
      )}

      {flowState === 'success' && successData && (
        <div className="flex flex-col items-center justify-center py-10 gap-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">Logged</p>
            <p className="text-gray-600 mt-1">
              {formatCurrency(amount)} in {successData.categoryName}
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-xl p-5">
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
              {successData.categoryName} Budget
            </p>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all ${
                  successData.remaining < 0 ? 'bg-red-500' : successData.remaining < successData.dailyAllowance * 3 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, ((successData.effectiveBudget - successData.remaining) / successData.effectiveBudget) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className={successData.remaining < 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {successData.remaining < 0 ? `${formatCurrency(Math.abs(successData.remaining))} over` : `${formatCurrency(successData.remaining)} left`}
              </span>
              <span className="text-gray-500">
                {successData.daysLeft} {pluralize(successData.daysLeft, 'day')} · {formatCurrency(successData.dailyAllowance)}/day
              </span>
            </div>
          </div>

          <button
            onClick={resetFlow}
            className="w-full py-4 bg-gray-900 text-white rounded-xl font-medium text-lg active:bg-gray-800 min-h-[56px]"
          >
            Check Another
          </button>
        </div>
      )}

      {showSkipToast && (
        <div className="fixed bottom-24 left-4 right-4 bg-gray-700 text-white rounded-lg p-4 flex items-center gap-3 shadow-lg z-50 animate-fade-in">
          <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">Skipped — no budget affected</span>
        </div>
      )}

      {showUndo && (
        <UndoToast
          message={undoMessage}
          onUndo={handleUndo}
          onDismiss={handleUndoDismiss}
        />
      )}
    </div>
  );
}
