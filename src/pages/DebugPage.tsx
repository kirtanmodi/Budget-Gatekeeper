import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { resetToDefaults } from '../store/budgetSlice';

export function DebugPage() {
  const dispatch = useAppDispatch();
  const budgetState = useAppSelector((state) => state.budget);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [expandedArchive, setExpandedArchive] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    categories,
    currentSnapshot,
    decisionLogs,
    archivedLogs,
    system,
    lastUsedCategoryId,
  } = budgetState;

  const handleExport = () => {
    const dataStr = JSON.stringify(budgetState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-gatekeeper-${system.today}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const dataStr = JSON.stringify(budgetState, null, 2);
    await navigator.clipboard.writeText(dataStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    dispatch(resetToDefaults());
    setShowConfirmReset(false);
  };

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.name || categoryId;
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Debug</h1>
      <p className="text-gray-600 mb-6">View all stored data</p>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleExport}
          className="flex-1 py-2 px-3 bg-gray-900 text-white rounded-lg text-sm font-medium"
        >
          Export JSON
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => setShowConfirmReset(true)}
          className="py-2 px-3 bg-red-600 text-white rounded-lg text-sm font-medium"
        >
          Clear All
        </button>
      </div>

      {/* System Info */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
          System
        </h2>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Today</span>
            <span className="font-mono text-gray-900">{system.today}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Used Category</span>
            <span className="font-mono text-gray-900">
              {lastUsedCategoryId || 'null'}
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
          Categories ({categories.length})
        </h2>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-3 py-2 text-gray-600">Name</th>
                <th className="text-right px-3 py-2 text-gray-600">Budget</th>
                <th className="text-right px-3 py-2 text-gray-600">Spent</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-t border-gray-200">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">{cat.name}</div>
                    <div className="text-xs text-gray-400 font-mono">
                      {cat.id}
                    </div>
                  </td>
                  <td className="text-right px-3 py-2 font-mono text-gray-900">
                    ₹{cat.monthlyBudget.toLocaleString('en-IN')}
                  </td>
                  <td className="text-right px-3 py-2 font-mono text-gray-900">
                    ₹{cat.currentSpent.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Current Month Snapshot */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
          Month Snapshot
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          {currentSnapshot ? (
            <div>
              <div className="text-gray-900 font-medium mb-2">
                {new Date(
                  currentSnapshot.year,
                  currentSnapshot.month
                ).toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className="text-xs text-gray-500">
                {currentSnapshot.categories.length} categories at month start
              </div>
            </div>
          ) : (
            <span className="text-gray-400 italic">No snapshot</span>
          )}
        </div>
      </section>

      {/* Current Month Logs */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
          Current Month Logs ({decisionLogs.length})
        </h2>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          {decisionLogs.length === 0 ? (
            <p className="p-4 text-gray-400 italic">No transactions</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-600">Date</th>
                  <th className="text-left px-3 py-2 text-gray-600">
                    Category
                  </th>
                  <th className="text-right px-3 py-2 text-gray-600">Amount</th>
                  <th className="text-center px-3 py-2 text-gray-600">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...decisionLogs].reverse().map((log) => (
                  <tr key={log.id} className="border-t border-gray-200">
                    <td className="px-3 py-2 font-mono text-gray-600">
                      {log.date}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {getCategoryName(log.categoryId)}
                    </td>
                    <td className="text-right px-3 py-2 font-mono text-gray-900">
                      ₹{log.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="text-center px-3 py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.decision === 'YES'
                            ? 'bg-green-100 text-green-700'
                            : log.decision === 'WAIT'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.decision}
                        {log.waitDays ? ` (${log.waitDays}d)` : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Archived Logs */}
      <section className="mb-6">
        <button
          onClick={() => setExpandedArchive(!expandedArchive)}
          className="flex items-center justify-between w-full text-left"
        >
          <h2 className="text-sm font-semibold text-gray-500 uppercase">
            Archived Logs ({archivedLogs.length})
          </h2>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expandedArchive ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {expandedArchive && (
          <div className="bg-gray-50 rounded-lg overflow-hidden mt-2">
            {archivedLogs.length === 0 ? (
              <p className="p-4 text-gray-400 italic">No archived logs</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600">Date</th>
                    <th className="text-left px-3 py-2 text-gray-600">
                      Category
                    </th>
                    <th className="text-right px-3 py-2 text-gray-600">
                      Amount
                    </th>
                    <th className="text-center px-3 py-2 text-gray-600">
                      Decision
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...archivedLogs].reverse().map((log) => (
                    <tr key={log.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-mono text-gray-600">
                        {log.date}
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        {getCategoryName(log.categoryId)}
                      </td>
                      <td className="text-right px-3 py-2 font-mono text-gray-900">
                        ₹{log.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="text-center px-3 py-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            log.decision === 'YES'
                              ? 'bg-green-100 text-green-700'
                              : log.decision === 'WAIT'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.decision}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* Confirm Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Clear All Data?
            </h3>
            <p className="text-gray-600 mb-6">
              This will reset categories to defaults and clear all current month
              logs. Archived logs will remain.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
