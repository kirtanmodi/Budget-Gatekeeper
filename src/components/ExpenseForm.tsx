import { useState, useMemo, useEffect } from 'react';
import type { Category, DecisionLog, CategorySuggestion } from '../types';
import { calculateDecision, getDaysInMonth } from '../engine/decision';
import { formatCurrency } from '../utils/format';
import { CategoryChip } from './CategoryChip';
import { suggestCategory } from '../engine/categorizer';

interface ExpenseFormProps {
  categories: Category[];
  today: string;
  onCheck: (categoryId: string, amount: number, description?: string) => void;
  disabled?: boolean;
  lastUsedCategoryId?: string | null;
  enableSmartCategorization?: boolean;
  decisionLogs?: DecisionLog[];
  graceThreshold?: number;
}

export function ExpenseForm({
  categories,
  today,
  onCheck,
  disabled,
  lastUsedCategoryId,
  enableSmartCategorization = false,
  decisionLogs = [],
  graceThreshold = 0.6,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(lastUsedCategoryId || '');
  const [description, setDescription] = useState('');
  const [debouncedDescription, setDebouncedDescription] = useState('');

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDescription(description);
    }, 300);
    return () => clearTimeout(timer);
  }, [description]);

  const suggestion = useMemo<CategorySuggestion | null>(() => {
    if (!enableSmartCategorization || !debouncedDescription.trim()) {
      return null;
    }
    return suggestCategory(debouncedDescription, categories, decisionLogs);
  }, [debouncedDescription, categories, decisionLogs, enableSmartCategorization]);

  useEffect(() => {
    if (suggestion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional sync from suggestion
      setCategoryId(suggestion.categoryId);
    }
  }, [suggestion]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };

  const preview = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (!categoryId || !numAmount || numAmount <= 0) return null;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return null;
    const todayDate = new Date(today);
    const currentDay = todayDate.getDate();
    const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());
    const effectiveThreshold = category.graceThreshold ?? graceThreshold;
    const decision = calculateDecision(
      category.monthlyBudget,
      category.currentSpent,
      numAmount,
      currentDay,
      daysInMonth,
      effectiveThreshold
    );
    if (decision.type === 'YES') return 'YES';
    if (decision.type === 'WAIT') return `WAIT ${decision.days}d`;
    return 'NO';
  }, [amount, categoryId, categories, today, graceThreshold]);

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (categoryId && numAmount > 0) {
      onCheck(categoryId, numAmount, description.trim() || undefined);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(value);
  };

  const isValid = categoryId && parseFloat(amount) > 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="amount" className="text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
            ₹
          </span>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            disabled={disabled}
            className="w-full pl-10 pr-4 py-4 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleQuickAmount(amt)}
              className="px-3 py-2 text-sm bg-gray-100 rounded-lg active:bg-gray-200 min-h-[44px]"
            >
              {formatCurrency(amt)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
          {enableSmartCategorization && (
            <span className="text-xs text-gray-400 font-normal ml-1">(auto-suggests category)</span>
          )}
        </label>
        <div className="relative">
          <input
            id="description"
            type="text"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="e.g., uber, pizza hut, groceries"
            disabled={disabled}
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100"
          />
          {suggestion && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                → {suggestion.categoryName}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-700">Category</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat.id} className="relative">
              <CategoryChip
                category={cat}
                selected={categoryId === cat.id}
                onClick={() => setCategoryId(cat.id)}
              />
              {suggestion?.categoryId === cat.id && categoryId === cat.id && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full" title="AI suggested" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!isValid || disabled}
          className="flex-1 py-4 text-lg font-semibold bg-gray-900 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-gray-800 min-h-[56px]"
        >
          Check
        </button>
        {preview && (
          <span
            className={`px-3 py-2 text-sm font-semibold rounded-lg ${
              preview === 'YES'
                ? 'bg-green-100 text-green-800'
                : preview === 'NO'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {preview}
          </span>
        )}
      </div>
    </form>
  );
}
