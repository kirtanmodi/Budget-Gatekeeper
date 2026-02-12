import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateBudget, addCategory, removeCategory, updateGraceThreshold, updateAiSettings, updateCategoryThreshold, clearCategoryThreshold } from '../store/budgetSlice';
import { CategoryBudgetRow } from '../components/CategoryBudgetRow';
import { ThresholdRecommendation } from '../components/ThresholdRecommendation';
import { generateThresholdRecommendations } from '../engine/thresholds';
import { hasEnoughData } from '../engine/patterns';
import { formatCurrency } from '../utils/format';

export function SettingsPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const graceThreshold = useAppSelector((state) => state.budget.settings?.graceThreshold ?? 0.6);
  const settings = useAppSelector((state) => state.budget.settings);

  const decisionLogs = useAppSelector((state) => state.budget.decisionLogs);
  const archivedLogs = useAppSelector((state) => state.budget.archivedLogs);
  const enablePersonalizedThresholds = settings?.enablePersonalizedThresholds ?? false;

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  const allLogs = useMemo(() => [...archivedLogs, ...decisionLogs], [archivedLogs, decisionLogs]);
  const hasEnoughHistoricalData = useMemo(() => hasEnoughData(allLogs), [allLogs]);

  const thresholdRecommendations = useMemo(() => {
    if (!enablePersonalizedThresholds || !hasEnoughHistoricalData) return [];
    return generateThresholdRecommendations(allLogs, categories, graceThreshold)
      .filter((r) => !dismissedRecommendations.has(r.categoryId));
  }, [allLogs, categories, graceThreshold, enablePersonalizedThresholds, hasEnoughHistoricalData, dismissedRecommendations]);

  const handleBudgetChange = (categoryId: string, newBudget: number) => {
    dispatch(updateBudget({ categoryId, newBudget }));
  };

  const handleRemove = (categoryId: string) => {
    dispatch(removeCategory(categoryId));
  };

  const handleGraceThresholdChange = (value: number) => {
    dispatch(updateGraceThreshold(value));
  };

  const handleCategoryThresholdChange = (categoryId: string, value: number) => {
    dispatch(updateCategoryThreshold({ categoryId, threshold: value }));
  };

  const handleApplyRecommendation = (categoryId: string, threshold: number) => {
    dispatch(updateCategoryThreshold({ categoryId, threshold }));
    setDismissedRecommendations((prev) => new Set([...prev, categoryId]));
  };

  const handleDismissRecommendation = (categoryId: string) => {
    setDismissedRecommendations((prev) => new Set([...prev, categoryId]));
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
            {formatCurrency(totalBudget)}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Changes apply immediately.
        </p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nf-red"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-nf-red"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  disabled={!newName.trim() || !parseFloat(newBudget)}
                  className="flex-1 py-2 bg-nf-red text-white rounded-lg disabled:bg-gray-300"
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

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Decision Settings</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700">Free Zone Threshold</span>
            <span className="text-sm font-medium text-gray-900">{Math.round(graceThreshold * 100)}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="80"
            value={graceThreshold * 100}
            onChange={(e) => handleGraceThresholdChange(parseInt(e.target.value) / 100)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
          />
          <p className="text-xs text-gray-500 mt-3">
            Spending below {Math.round(graceThreshold * 100)}% of your budget auto-approves without pace checks.
            Higher = more lenient early in the month.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Features</h2>
        <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
          <label className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex-1 pr-4">
              <span className="text-sm font-medium text-gray-900">Smart Categorization</span>
              <p className="text-xs text-gray-500 mt-1">Auto-suggest category from expense description</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.enableSmartCategorization ?? false}
              onChange={(e) => dispatch(updateAiSettings({ enableSmartCategorization: e.target.checked }))}
              className="w-5 h-5 rounded accent-gray-900"
            />
          </label>

          <label className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex-1 pr-4">
              <span className="text-sm font-medium text-gray-900">Predictive Alerts</span>
              <p className="text-xs text-gray-500 mt-1">Get warned before you overspend based on patterns</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.enablePredictiveAlerts ?? false}
              onChange={(e) => dispatch(updateAiSettings({ enablePredictiveAlerts: e.target.checked }))}
              className="w-5 h-5 rounded accent-gray-900"
            />
          </label>

          <label className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex-1 pr-4">
              <span className="text-sm font-medium text-gray-900">Natural Language Input</span>
              <p className="text-xs text-gray-500 mt-1">Type "spent 500 on food" instead of filling form</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.enableNluInput ?? false}
              onChange={(e) => dispatch(updateAiSettings({ enableNluInput: e.target.checked }))}
              className="w-5 h-5 rounded accent-gray-900"
            />
          </label>

          <label className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex-1 pr-4">
              <span className="text-sm font-medium text-gray-900">Personalized Thresholds</span>
              <p className="text-xs text-gray-500 mt-1">AI-tuned free zone per category based on your history</p>
            </div>
            <input
              type="checkbox"
              checked={settings?.enablePersonalizedThresholds ?? false}
              onChange={(e) => dispatch(updateAiSettings({ enablePersonalizedThresholds: e.target.checked }))}
              className="w-5 h-5 rounded accent-gray-900"
            />
          </label>
        </div>
      </div>

      {enablePersonalizedThresholds && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Per-Category Thresholds</h2>

          {!hasEnoughHistoricalData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-700">Building your spending patterns</p>
                  <p className="text-xs text-gray-500 mt-1">
                    AI recommendations will appear after 3 months of usage.
                  </p>
                </div>
              </div>
            </div>
          )}

          {thresholdRecommendations.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">AI Recommendations</p>
              <div className="space-y-3">
                {thresholdRecommendations.map((rec) => {
                  const category = categories.find((c) => c.id === rec.categoryId);
                  return (
                    <ThresholdRecommendation
                      key={rec.categoryId}
                      recommendation={rec}
                      categoryName={category?.name || 'Unknown'}
                      onApply={handleApplyRecommendation}
                      onDismiss={handleDismissRecommendation}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
            {categories.map((category) => {
              const currentThreshold = category.graceThreshold ?? graceThreshold;
              const isCustom = category.graceThreshold !== undefined;
              return (
                <div key={category.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {category.name}
                      {isCustom && (
                        <span className="ml-2 text-xs text-blue-600">(custom)</span>
                      )}
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round(currentThreshold * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="80"
                    value={currentThreshold * 100}
                    onChange={(e) => handleCategoryThresholdChange(category.id, parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                  />
                  {isCustom && (
                    <button
                      onClick={() => dispatch(clearCategoryThreshold(category.id))}
                      className="text-xs text-gray-500 mt-1 underline"
                    >
                      Reset to global ({Math.round(graceThreshold * 100)}%)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
