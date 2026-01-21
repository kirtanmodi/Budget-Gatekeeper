import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateBudget } from '../store/budgetSlice';
import { CategoryBudgetRow } from '../components/CategoryBudgetRow';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const currentSnapshot = useAppSelector((state) => state.budget.currentSnapshot);

  const handleBudgetChange = (categoryId: string, newBudget: number) => {
    dispatch(updateBudget({ categoryId, newBudget }));
  };

  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyBudget, 0);

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
            ₹{totalBudget.toLocaleString('en-IN')}
          </span>
        </div>
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
          />
        ))}
      </div>
    </div>
  );
}
