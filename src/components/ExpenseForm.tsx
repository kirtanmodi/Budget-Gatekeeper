import { useState, useMemo } from 'react';
import type { Category, DecisionLog } from '../types';
import { calculateDecision, getDaysInMonth } from '../engine/decision';

interface ExpenseFormProps {
  categories: Category[];
  decisionLogs: DecisionLog[];
  today: string;
  onCheck: (categoryId: string, amount: number) => void;
  disabled?: boolean;
  lastUsedCategoryId?: string | null;
}

export function ExpenseForm({ categories, decisionLogs, today, onCheck, disabled, lastUsedCategoryId }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(lastUsedCategoryId || '');

  const quickAmounts = useMemo(() => {
    const defaultAmounts = [100, 500, 1000, 2000, 5000];
    if (!categoryId) return defaultAmounts;
    const categoryLogs = decisionLogs.filter(
      (l) => l.categoryId === categoryId && l.action === 'BOUGHT'
    );
    if (categoryLogs.length === 0) return defaultAmounts;
    const counts = categoryLogs.reduce((acc, l) => {
      acc[l.amount] = (acc[l.amount] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    const fromHistory = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([amt]) => Number(amt));
    return fromHistory.length > 0 ? fromHistory : defaultAmounts;
  }, [decisionLogs, categoryId]);

  const preview = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (!categoryId || !numAmount || numAmount <= 0) return null;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return null;
    const todayDate = new Date(today);
    const currentDay = todayDate.getDate();
    const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());
    const decision = calculateDecision(
      category.monthlyBudget,
      category.currentSpent,
      numAmount,
      currentDay,
      daysInMonth
    );
    if (decision.type === 'YES') return 'YES';
    if (decision.type === 'WAIT') return `WAIT ${decision.days}d`;
    return 'NO';
  }, [amount, categoryId, categories, today]);

  const handleQuickAmount = (amt: number) => {
    setAmount(amt.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (categoryId && numAmount > 0) {
      onCheck(categoryId, numAmount);
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
              ₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-medium text-gray-700">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 appearance-none bg-white"
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
