import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateBudget, addCategory, removeCategory, getEffectiveBudget } from '../store/budgetSlice';
import { CategoryBudgetRow } from '../components/CategoryBudgetRow';
import { formatCurrency } from '../utils/format';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const currentSnapshot = useAppSelector((state) => state.budget.currentSnapshot);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');

  const handleBudgetChange = (categoryId: string, newBudget: number) => {
    dispatch(updateBudget({ categoryId, newBudget }));
  };

  const handleRemove = (categoryId: string) => {
    dispatch(removeCategory(categoryId));
  };

  const handleAddCategory = () => {
    const budget = parseFloat(newBudget) || 0;
    if (newName.trim() && budget > 0) {
      dispatch(addCategory({ name: newName.trim(), monthlyBudget: budget }));
      setNewName('');
      setNewBudget('');
      setShowAddForm(false);
    }
  };

  const totalBaseBudget = categories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const totalEffectiveBudget = categories.reduce((sum, c) => sum + getEffectiveBudget(c), 0);
  const hasAnyAdjustments = totalBaseBudget !== totalEffectiveBudget;

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-600 mb-6">
        Edit your monthly budget for each category
      </p>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Monthly Budget</span>
          <span className="text-xl font-semibold text-gray-900">
            {formatCurrency(totalBaseBudget)}
          </span>
        </div>
        {hasAnyAdjustments && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-blue-600">Effective (with adjustments)</span>
            <span className="text-sm font-medium text-blue-600">
              {formatCurrency(totalEffectiveBudget)}
            </span>
          </div>
        )}
        {currentSnapshot && (
          <p className="text-xs text-gray-500 mt-2">
            Changes apply immediately. Month snapshot taken at start of{' '}
            {new Date(currentSnapshot.year, currentSnapshot.month).toLocaleDateString('en-IN', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      <div className="flex-1">
        {categories.map((category) => (
          <CategoryBudgetRow
            key={category.id}
            category={category}
            onBudgetChange={handleBudgetChange}
            onRemove={handleRemove}
          />
        ))}

        {showAddForm ? (
          <div className="py-4 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <span className="text-gray-500">₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Monthly budget"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  disabled={!newName.trim() || !parseFloat(newBudget)}
                  className="flex-1 py-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-300"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewName('');
                    setNewBudget('');
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 text-gray-600 border-b border-gray-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        )}
      </div>
    </div>
  );
}
