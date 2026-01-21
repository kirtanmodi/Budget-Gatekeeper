import { useState, useMemo, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logDecision, setLastUsedCategory, undoLastDecision } from '../store/budgetSlice';
import { ExpenseForm } from '../components/ExpenseForm';
import { ContextMessage } from '../components/ContextMessage';
import { DecisionResult } from '../components/DecisionResult';
import { PostDecisionActions } from '../components/PostDecisionActions';
import { UndoToast } from '../components/UndoToast';
import { calculateDecision, calculateContext, getDaysInMonth } from '../engine/decision';
import { triggerHaptic } from '../utils/haptics';
import type { Decision } from '../types';

type FlowState = 'input' | 'result';

export function CheckPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const decisionLogs = useAppSelector((state) => state.budget.decisionLogs);
  const today = useAppSelector((state) => state.budget.system.today);
  const lastUsedCategoryId = useAppSelector((state) => state.budget.lastUsedCategoryId);

  const [flowState, setFlowState] = useState<FlowState>('input');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState('');

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
      selectedCategory.monthlyBudget,
      selectedCategory.currentSpent,
      currentDay,
      daysInMonth
    );
  }, [selectedCategory, currentDay, daysInMonth]);

  const waitContext = useMemo(() => {
    if (!decision || decision.type !== 'WAIT' || !selectedCategory) return undefined;
    const buyDay = currentDay + decision.days;
    const daysLeftAfterPurchase = Math.max(1, daysInMonth - buyDay);
    const weeksLeftAfterPurchase = Math.max(1, Math.ceil(daysLeftAfterPurchase / 7));
    const remainingAfterPurchase = selectedCategory.monthlyBudget - selectedCategory.currentSpent - amount;
    const daysLeftToday = Math.max(1, daysInMonth - currentDay);
    const currentDailyRate = (selectedCategory.monthlyBudget - selectedCategory.currentSpent - amount) / daysLeftToday;
    return {
      remainingAfterPurchase,
      daysLeftAfterPurchase,
      weeksLeftAfterPurchase,
      currentDailyRate,
    };
  }, [decision, selectedCategory, currentDay, daysInMonth, amount]);

  const handleCheck = (categoryId: string, checkAmount: number) => {
    setSelectedCategoryId(categoryId);
    setAmount(checkAmount);

    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    const result = calculateDecision(
      category.monthlyBudget,
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
        action: 'BOUGHT',
      })
    );

    setUndoMessage(`Bought ₹${amount.toLocaleString('en-IN')} in ${categoryName}`);
    setShowUndo(true);
    resetFlow();
  };

  const handleSkipped = () => {
    if (!selectedCategoryId || !decision) return;

    const categoryName = categories.find((c) => c.id === selectedCategoryId)?.name || '';

    dispatch(
      logDecision({
        categoryId: selectedCategoryId,
        amount,
        decision: decision.type,
        waitDays: decision.type === 'WAIT' ? decision.days : undefined,
        action: 'SKIPPED',
      })
    );

    setUndoMessage(`Skipped ₹${amount.toLocaleString('en-IN')} in ${categoryName}`);
    setShowUndo(true);
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
          decisionLogs={decisionLogs}
          today={today}
          onCheck={handleCheck}
          lastUsedCategoryId={lastUsedCategoryId}
        />
      )}

      {flowState === 'result' && selectedCategory && context && decision && (
        <div
          className="flex flex-col gap-6"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="text-center">
            <p className="text-lg text-gray-600">
              ₹{amount.toLocaleString('en-IN')} for {selectedCategory.name}
            </p>
          </div>

          <ContextMessage context={context} categoryName={selectedCategory.name} />

          <DecisionResult decision={decision} today={today} waitContext={waitContext} />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2 text-center">If you buy this</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className={`text-xl font-bold ${context.remaining - amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  ₹{Math.round(context.remaining - amount).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Per week</p>
                <p className={`text-xl font-bold ${(context.remaining - amount) / context.weeksLeft < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  ₹{Math.round((context.remaining - amount) / context.weeksLeft).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">in {selectedCategory.name}</p>
          </div>

          <PostDecisionActions onBought={handleBought} onSkipped={handleSkipped} />

          <p className="text-xs text-gray-400 text-center">
            Swipe right for Bought · Swipe left for Skipped
          </p>

          <button
            onClick={resetFlow}
            className="w-full py-3 text-gray-600 underline"
          >
            Start Over
          </button>
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
