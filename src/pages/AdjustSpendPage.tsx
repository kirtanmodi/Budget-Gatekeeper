import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setSpent, resetAllSpent, resetToDefaults } from '../store/budgetSlice';
import { CategorySpendRow } from '../components/CategorySpendRow';

export function AdjustSpendPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);

  const handleSpentChange = (categoryId: string, amount: number) => {
    dispatch(setSpent({ categoryId, amount }));
  };

  const handleResetSpent = () => {
    if (confirm('Reset all spending to zero?')) {
      dispatch(resetAllSpent());
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset categories to defaults? This will clear all spending and remove any old categories.')) {
      dispatch(resetToDefaults());
    }
  };

  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.currentSpent, 0);

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Adjust Spend</h1>
      <p className="text-gray-600 mb-4">
        Update your current spending for each category
      </p>

      <div className="flex flex-col gap-3 mb-6">
        <button
          onClick={handleResetSpent}
          className="w-full py-3 text-gray-700 border border-gray-300 rounded-lg active:bg-gray-100"
        >
          Reset All Spending to Zero
        </button>
        <button
          onClick={handleResetToDefaults}
          className="w-full py-3 text-red-600 border border-red-300 rounded-lg active:bg-red-50"
        >
          Reset Categories to Defaults
        </button>
      </div>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Spent</span>
          <span className="text-xl font-semibold text-gray-900">
            ₹{totalSpent.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-gray-600">Total Budget</span>
          <span className="text-gray-600">
            ₹{totalBudget.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="flex-1">
        {categories.map((category) => (
          <CategorySpendRow
            key={category.id}
            category={category}
            onSpentChange={handleSpentChange}
          />
        ))}
      </div>
    </div>
  );
}
