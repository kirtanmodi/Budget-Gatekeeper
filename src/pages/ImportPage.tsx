import { useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { importTransactions } from '../store/budgetSlice';
import { parseHDFCPDF, type ParsedTransaction } from '../utils/pdfParser';
import { matchCategory, getShortDescription } from '../data/categoryKeywords';
import { formatCurrency } from '../utils/format';
import { triggerHaptic } from '../utils/haptics';

interface PreviewTransaction extends ParsedTransaction {
  categoryId: string | null;
  shortDesc: string;
  ignored: boolean;
}

type FilterType = 'all' | 'uncategorized' | 'income' | 'ignored';
type SortType = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export function ImportPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.budget.categories);

  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<PreviewTransaction[]>([]);
  const [imported, setImported] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date-desc');
  const [bulkCategory, setBulkCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setTransactions([]);
      setImported(false);
      setNeedsPassword(false);
      setPassword('');
    }
  };

  const handleParse = async (usePassword = false) => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const parsed = await parseHDFCPDF(file, usePassword ? password : undefined);

      if (parsed.length === 0) {
        setError('No expenses found in this statement');
        setParsing(false);
        return;
      }

      const withCategories: PreviewTransaction[] = parsed.map((tx) => ({
        ...tx,
        categoryId: tx.type === 'income' ? null : matchCategory(tx.narration, categories),
        shortDesc: getShortDescription(tx.narration),
        ignored: tx.type === 'income',
      }));

      setTransactions(withCategories);
      setNeedsPassword(false);
      triggerHaptic('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse PDF';
      if (message.includes('password') || message.includes('Password')) {
        if (!usePassword) {
          setNeedsPassword(true);
          setError('This PDF is password protected. Enter your Customer ID.');
        } else {
          setError('Incorrect password. For HDFC, use your Customer ID.');
        }
      } else {
        setError(message);
      }
      triggerHaptic('error');
    } finally {
      setParsing(false);
    }
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, categoryId } : tx))
    );
  };

  const handleToggleIgnore = (index: number) => {
    setTransactions((prev) =>
      prev.map((tx, i) => (i === index ? { ...tx, ignored: !tx.ignored } : tx))
    );
  };

  const activeTransactions = transactions.filter((tx) => !tx.ignored);
  const allCategorized = activeTransactions.every((tx) => tx.categoryId !== null);
  const ignoredCount = transactions.filter((tx) => tx.ignored).length;
  const incomeCount = transactions.filter((tx) => tx.type === 'income').length;

  const filteredTransactions = transactions
    .filter((tx) => {
      switch (filter) {
        case 'uncategorized': return !tx.ignored && tx.categoryId === null;
        case 'income': return tx.type === 'income';
        case 'ignored': return tx.ignored;
        default: return true;
      }
    })
    .sort((a, b) => {
      switch (sort) {
        case 'date-asc': return a.date.localeCompare(b.date);
        case 'date-desc': return b.date.localeCompare(a.date);
        case 'amount-asc': return a.amount - b.amount;
        case 'amount-desc': return b.amount - a.amount;
        default: return 0;
      }
    });

  const handleBulkSetCategory = () => {
    if (!bulkCategory) return;
    setTransactions((prev) =>
      prev.map((tx) =>
        !tx.ignored && tx.categoryId === null
          ? { ...tx, categoryId: bulkCategory }
          : tx
      )
    );
    setBulkCategory('');
    triggerHaptic('success');
  };

  const handleIgnoreAllIncome = () => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.type === 'income' ? { ...tx, ignored: true } : tx
      )
    );
    triggerHaptic('success');
  };

  const handleImport = () => {
    if (!allCategorized) return;

    const toImport = activeTransactions.map((tx) => ({
      categoryId: tx.categoryId!,
      amount: tx.amount,
      date: tx.date,
      description: tx.shortDesc,
    }));

    dispatch(importTransactions({ transactions: toImport }));
    setImported(true);
    triggerHaptic('success');
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const uncategorizedCount = activeTransactions.filter((tx) => tx.categoryId === null).length;

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Import Statement</h1>
      <p className="text-gray-600 mb-6">Import expenses from your HDFC bank statement PDF</p>

      {imported ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Complete</h2>
          <p className="text-gray-600 mb-6">{activeTransactions.length} transactions imported</p>
          <button
            onClick={() => {
              setFile(null);
              setPassword('');
              setTransactions([]);
              setImported(false);
            }}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium"
          >
            Import Another
          </button>
        </div>
      ) : (
        <>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 active:bg-gray-50"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {file ? (
              <p className="text-gray-900 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-gray-600 font-medium">Tap to select PDF</p>
                <p className="text-sm text-gray-500 mt-1">HDFC Bank Statement</p>
              </>
            )}
          </div>

          {file && transactions.length === 0 && !needsPassword && (
            <button
              onClick={() => handleParse(false)}
              disabled={parsing}
              className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium mb-4 disabled:bg-gray-300"
            >
              {parsing ? 'Parsing...' : 'Parse Statement'}
            </button>
          )}

          {file && transactions.length === 0 && needsPassword && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (Customer ID)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Customer ID"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                <button
                  onClick={() => handleParse(true)}
                  disabled={parsing || !password}
                  className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:bg-gray-300"
                >
                  {parsing ? 'Parsing...' : 'Parse'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                HDFC statements are password protected with your Customer ID
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {transactions.length > 0 && (
            <>
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeTransactions.length} to import
                  </h2>
                  <div className="text-sm text-right">
                    {ignoredCount > 0 && (
                      <span className="text-gray-500">{ignoredCount} ignored</span>
                    )}
                    {uncategorizedCount > 0 && (
                      <span className="text-orange-600 ml-2">{uncategorizedCount} need category</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tap "Ignore" on transfers or income you don't want to track</p>
              </div>

              {/* Filter & Bulk Actions */}
              <div className="mb-4 space-y-3">
                {/* Filter tabs + Sort */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                    {[
                      { key: 'all', label: 'All', count: transactions.length },
                      { key: 'uncategorized', label: 'Uncategorized', count: uncategorizedCount },
                      { key: 'income', label: 'Income', count: incomeCount },
                      { key: 'ignored', label: 'Ignored', count: ignoredCount },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as FilterType)}
                        className={`px-3 py-2 text-sm rounded-full whitespace-nowrap min-h-[44px] ${
                          filter === tab.key
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white min-h-[44px]"
                  >
                    <option value="date-desc">Date ↓</option>
                    <option value="date-asc">Date ↑</option>
                    <option value="amount-desc">Amount ↓</option>
                    <option value="amount-asc">Amount ↑</option>
                  </select>
                </div>

                {/* Bulk actions */}
                {uncategorizedCount > 0 && (
                  <div className="flex gap-2 items-center">
                    <select
                      value={bulkCategory}
                      onChange={(e) => setBulkCategory(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Set all uncategorized to...</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleBulkSetCategory}
                      disabled={!bulkCategory}
                      className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg disabled:bg-gray-300 min-h-[44px] active:bg-gray-800"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Ignore all income shortcut */}
                {incomeCount > 0 && transactions.some((tx) => tx.type === 'income' && !tx.ignored) && (
                  <button
                    onClick={handleIgnoreAllIncome}
                    className="w-full py-2 text-sm text-gray-600 bg-gray-100 rounded-lg min-h-[44px] active:bg-gray-200"
                  >
                    Ignore all income ({transactions.filter((tx) => tx.type === 'income' && !tx.ignored).length})
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto -mx-4 px-4">
                {filteredTransactions.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No transactions match this filter
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTransactions.map((tx) => {
                      const originalIndex = transactions.indexOf(tx);
                      return (
                        <div
                          key={`${tx.date}-${tx.amount}-${originalIndex}`}
                          className={`p-3 rounded-lg border ${
                            tx.ignored
                              ? tx.type === 'income'
                                ? 'border-green-200 bg-green-50 opacity-60'
                                : 'border-gray-200 bg-gray-100 opacity-60'
                              : tx.categoryId === null
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">{formatDate(tx.date)}</span>
                              {tx.type === 'income' && (
                                <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                                  Income
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                tx.ignored
                                  ? 'text-gray-400 line-through'
                                  : tx.type === 'income'
                                    ? 'text-green-600'
                                    : 'text-gray-900'
                              }`}>
                                {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                              </span>
                              <button
                                onClick={() => handleToggleIgnore(originalIndex)}
                                className={`px-3 py-2 text-xs rounded min-h-[44px] ${
                                  tx.ignored
                                    ? 'bg-gray-200 text-gray-600 active:bg-gray-300'
                                    : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                                }`}
                              >
                                {tx.ignored ? 'Include' : 'Ignore'}
                              </button>
                            </div>
                          </div>
                          <p className={`text-sm font-medium mb-1 ${tx.ignored ? 'text-gray-400' : 'text-gray-900'}`}>
                            {tx.shortDesc}
                          </p>
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                            {tx.narration}
                          </p>
                          {!tx.ignored && tx.type !== 'income' && (
                            <select
                              value={tx.categoryId || ''}
                              onChange={(e) => handleCategoryChange(originalIndex, e.target.value)}
                              className={`w-full px-3 py-2 rounded-lg border text-sm ${
                                tx.categoryId === null
                                  ? 'border-orange-300 bg-white'
                                  : 'border-gray-200 bg-gray-50'
                              }`}
                            >
                              <option value="">Select category...</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleImport}
                  disabled={!allCategorized || activeTransactions.length === 0}
                  className="w-full py-4 bg-gray-900 text-white rounded-lg font-medium text-lg disabled:bg-gray-300"
                >
                  Import {activeTransactions.length} Transaction{activeTransactions.length !== 1 ? 's' : ''}
                </button>
                {!allCategorized && (
                  <p className="text-center text-sm text-orange-600 mt-2">
                    Select a category for all transactions to import
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
