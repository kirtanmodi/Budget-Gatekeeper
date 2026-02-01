import { useState, useMemo, useCallback, useRef } from 'react';
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

type FlowState = 'input' | 'result';

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

    const categoryName = categories.find((c) => c.id === selectedCategoryId)?.name || '';

    dispatch(
      logDecision({
        categoryId: selectedCategoryId,
        amount,
        decision: decision.type,
        waitDays: decision.type === 'WAIT' ? decision.days : undefined,
      })
    );

    setUndoMessage(`Bought ${formatCurrency(amount)} in ${categoryName}`);
    setShowUndo(true);
    resetFlow();
  };

  const handleSkipped = () => {
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
  };

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
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Before</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(remainingBefore)}
                </p>
              </div>
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">After</p>
                <p className={`text-2xl font-bold ${remainingAfter < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(remainingAfter)}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-3">
              {daysLeft} {pluralize(daysLeft, 'day')} left · {formatCurrency(dailyAfter)}/day after
            </p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            {showDetails ? 'Hide details' : 'Show details'}
          </button>

          {showDetails && (
            <ContextMessage context={context} categoryName={selectedCategory.name} />
          )}

          <PostDecisionActions onBought={handleBought} onSkipped={handleSkipped} />

          <p className="text-xs text-gray-400 text-center">
            Swipe right for Bought · Swipe left for Skip
          </p>
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
