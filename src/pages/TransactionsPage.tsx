import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateTransaction, deleteTransaction } from '../store/budgetSlice';
import { formatCurrency, pluralize } from '../utils/format';
import { MonthPicker } from '../components/MonthPicker';
import {
  type MonthYear,
  filterLogsByMonth,
  getEarliestLogMonth,
  isSameMonth,
} from '../utils/date';

export function TransactionsPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);
  const decisionLogs = useAppSelector((state) => state.budget.decisionLogs);
  const archivedLogs = useAppSelector((state) => state.budget.archivedLogs);
  const system = useAppSelector((state) => state.budget.system);

  const todayDate = useMemo(() => new Date(system.today), [system.today]);
  const currentMonth: MonthYear = useMemo(
    () => ({
      year: todayDate.getFullYear(),
      month: todayDate.getMonth(),
    }),
    [todayDate]
  );

  const [viewDate, setViewDate] = useState<MonthYear>(currentMonth);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const isCurrentMonth = isSameMonth(viewDate, currentMonth);

  const minDate = useMemo(() => {
    const earliest = getEarliestLogMonth(archivedLogs);
    return earliest || currentMonth;
  }, [archivedLogs, currentMonth]);

  const displayLogs = useMemo(() => {
    const logs = isCurrentMonth
      ? decisionLogs
      : filterLogsByMonth(archivedLogs, viewDate.year, viewDate.month);

    return [...logs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [isCurrentMonth, decisionLogs, archivedLogs, viewDate]);

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

  const totalSpent = displayLogs.reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Transactions</h1>

      <MonthPicker
        value={viewDate}
        onChange={setViewDate}
        minDate={minDate}
        maxDate={currentMonth}
      />

      <p className="text-gray-600 mb-4">
        {displayLogs.length} {pluralize(displayLogs.length, 'purchase')}{' '}
        {isCurrentMonth ? 'this month' : ''}
      </p>

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Spent</span>
          <span className="text-xl font-semibold text-gray-900">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      {displayLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">No transactions{isCurrentMonth ? ' yet' : ''}</p>
          <p className="text-sm text-gray-500 mt-1">
            {isCurrentMonth ? 'Your purchases will appear here' : 'No purchases recorded this month'}
          </p>
        </div>
      ) : (
        <div className="flex-1">
          {displayLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-4 border-b border-gray-200"
            >
              {editingId === log.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getCategoryName(log.categoryId)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500">₹</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={editAmount}
                        onChange={(e) =>
                          setEditAmount(e.target.value.replace(/[^0-9.]/g, ''))
                        }
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {getCategoryName(log.categoryId)}
                      </p>
                      <span
                        className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                          log.decision === 'YES'
                            ? 'bg-emerald-100 text-emerald-700'
                            : log.decision === 'WAIT'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {log.decision}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{formatDate(log.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(log.amount)}
                    </span>
                    {isCurrentMonth && (
                      <>
                        <button
                          onClick={() => handleEdit(log.id, log.amount)}
                          className="p-2 text-gray-400 active:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`Edit ${getCategoryName(log.categoryId)} transaction`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-2 text-gray-400 active:text-red-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label={`Delete ${getCategoryName(log.categoryId)} transaction`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </>
                    )}
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
