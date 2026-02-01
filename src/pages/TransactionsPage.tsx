import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateTransaction, deleteTransaction } from '../store/budgetSlice';
import { formatCurrency, pluralize } from '../utils/format';

export function TransactionsPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const decisionLogs = useAppSelector((state) => state.budget.decisionLogs);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const boughtLogs = [...decisionLogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const handleEdit = (id: string, currentAmount: number) => {
    setEditingId(id);
    setEditAmount(currentAmount.toString());
  };

  const handleSave = (id: string) => {
    const newAmount = parseFloat(editAmount);
    if (newAmount > 0) {
      dispatch(updateTransaction({ id, newAmount }));
    }
    setEditingId(null);
    setEditAmount('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAmount('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this transaction?')) {
      dispatch(deleteTransaction(id));
    }
  };

  const totalSpent = boughtLogs.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>
      <p className="text-gray-600 mb-4">
        {boughtLogs.length} {pluralize(boughtLogs.length, 'purchase')} this month
      </p>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Spent</span>
          <span className="text-xl font-semibold text-gray-900">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {boughtLogs.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No transactions yet
        </div>
      ) : (
        <div className="flex-1">
          {boughtLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-4 border-b border-gray-200"
            >
              {editingId === log.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getCategoryName(log.categoryId)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded text-lg"
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(log.id)}
                    className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg min-h-[44px]"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-sm text-gray-600 min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getCategoryName(log.categoryId)}</p>
                    <p className="text-sm text-gray-500">{formatDate(log.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(log.amount)}
                    </span>
                    <button
                      onClick={() => handleEdit(log.id, log.amount)}
                      className="p-2 text-gray-400 active:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-gray-400 active:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
