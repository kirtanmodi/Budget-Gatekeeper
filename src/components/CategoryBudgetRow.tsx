import { useState } from 'react';
import type { Category } from '../types';

interface CategoryBudgetRowProps {
  category: Category;
  onBudgetChange: (categoryId: string, newBudget: number) => void;
}

export function CategoryBudgetRow({ category, onBudgetChange }: CategoryBudgetRowProps) {
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

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-200">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{category.name}</p>
        <p className="text-sm text-gray-500">
          Spent: ₹{category.currentSpent.toLocaleString('en-IN')}
        </p>
      </div>
      <div className="flex items-center">
        <span className="text-gray-500 mr-1">₹</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-24 text-right text-lg font-medium py-2 px-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>
    </div>
  );
}
