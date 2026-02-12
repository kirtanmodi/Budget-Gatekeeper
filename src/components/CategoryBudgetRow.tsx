import { useState } from 'react';
import type { Category } from '../types';
import { formatCurrency } from '../utils/format';

interface CategoryBudgetRowProps {
  category: Category;
  onBudgetChange: (categoryId: string, newBudget: number) => void;
  onRemove: (categoryId: string) => void;
}

export function CategoryBudgetRow({ category, onBudgetChange, onRemove }: CategoryBudgetRowProps) {
  const [editValue, setEditValue] = useState<string | null>(null);

  const displayValue = editValue ?? category.monthlyBudget.toString();

  const handleBlur = () => {
    if (editValue !== null) {
      const numValue = parseFloat(editValue) || 0;
      if (numValue !== category.monthlyBudget && numValue > 0) {
        onBudgetChange(category.id, numValue);
      }
      setEditValue(null);
    }
  };

  const handleFocus = () => {
    setEditValue(category.monthlyBudget.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setEditValue(value);
  };

  const handleRemove = () => {
    if (confirm(`Remove "${category.name}" category?`)) {
      onRemove(category.id);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-medium text-gray-900 truncate">{category.name}</p>
        <p className="text-sm text-gray-500">
          Spent: {formatCurrency(category.currentSpent)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">₹</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-20 text-right text-lg font-medium py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-nf-red focus:border-transparent"
        />
        <button
          onClick={handleRemove}
          className="p-2 text-gray-400 active:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
