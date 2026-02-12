import { useState } from 'react';
import type { Category } from '../types';
import { formatCurrency } from '../utils/format';

interface CategorySpendRowProps {
  category: Category;
  onSpentChange: (categoryId: string, amount: number) => void;
}

export function CategorySpendRow({ category, onSpentChange }: CategorySpendRowProps) {
  const [editValue, setEditValue] = useState<string | null>(null);

  const displayValue = editValue ?? category.currentSpent.toString();

  const handleBlur = () => {
    if (editValue !== null) {
      const numValue = parseFloat(editValue) || 0;
      if (numValue !== category.currentSpent) {
        onSpentChange(category.id, numValue);
      }
      setEditValue(null);
    }
  };

  const handleFocus = () => {
    setEditValue(category.currentSpent.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.-]/g, '');
    setEditValue(value);
  };

  const percentUsed = category.monthlyBudget > 0
    ? (category.currentSpent / category.monthlyBudget) * 100
    : 0;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{category.name}</p>
        <p className="text-sm text-gray-500">
          Budget: {formatCurrency(category.monthlyBudget)} ({percentUsed.toFixed(0)}% used)
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-gray-500 mr-1">₹</span>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-24 text-right text-lg font-medium py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-nf-red focus:border-transparent"
        />
      </div>
    </div>
  );
}
