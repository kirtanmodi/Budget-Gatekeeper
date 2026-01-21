import { useState } from 'react';
import type { Category } from '../types';

interface ExpenseFormProps {
  categories: Category[];
  onCheck: (categoryId: string, amount: number) => void;
  disabled?: boolean;
}

export function ExpenseForm({ categories, onCheck, disabled }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');

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

      <button
        type="submit"
        disabled={!isValid || disabled}
        className="w-full py-4 text-lg font-semibold bg-gray-900 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-gray-800 min-h-[56px]"
      >
        Check
      </button>
    </form>
  );
}
