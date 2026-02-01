import type { Category } from '../types';
import { getEffectiveBudget } from '../store/budgetSlice';
import { formatCompactCurrency } from '../utils/format';

interface CategoryChipProps {
  category: Category;
  selected: boolean;
  onClick: () => void;
}

export function CategoryChip({ category, selected, onClick }: CategoryChipProps) {
  const effectiveBudget = getEffectiveBudget(category);
  const remaining = effectiveBudget - category.currentSpent;
  const isOver = remaining < 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl min-h-[44px] text-sm transition-all active:scale-95 ${
        selected
          ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
          : isOver
          ? 'bg-red-50 text-red-700 active:bg-red-100'
          : 'bg-gray-100 text-gray-900 active:bg-gray-200'
      }`}
    >
      <span className="font-medium">{category.name}</span>
      <span className={`block text-xs mt-0.5 ${
        selected
          ? isOver ? 'text-red-300' : 'text-gray-400'
          : isOver ? 'text-red-500' : 'text-gray-500'
      }`}>
        {isOver ? `${formatCompactCurrency(Math.abs(remaining))} over` : `${formatCompactCurrency(remaining)} left`}
      </span>
    </button>
  );
}
