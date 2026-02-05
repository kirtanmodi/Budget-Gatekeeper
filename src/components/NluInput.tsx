import { useState, useEffect, useCallback, useMemo } from 'react';
import { parseNaturalInput } from '../engine/nlu';
import { suggestCategory } from '../engine/categorizer';
import { formatCurrency } from '../utils/format';
import type { NluParseResult, Category, DecisionLog } from '../types';

interface NluInputProps {
  today: string;
  categories: Category[];
  decisionLogs: DecisionLog[];
  onParsed: (result: NluParseResult) => void;
  onUse: (result: NluParseResult) => void;
  onCancel: () => void;
}

export function NluInput({ today, categories, decisionLogs, onParsed, onUse, onCancel }: NluInputProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<NluParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCategoryId, setManualCategoryId] = useState<string | null>(null);

  const autoMatchedCategory = useMemo(() => {
    if (!result?.categoryHint) return null;
    // First check if categoryHint is a direct category ID match
    const directMatch = categories.find(c => c.id === result.categoryHint);
    if (directMatch) return directMatch;
    // Fall back to keyword-based suggestion using raw input
    const suggestion = suggestCategory(result.rawInput, categories, decisionLogs);
    return suggestion ? categories.find(c => c.id === suggestion.categoryId) : null;
  }, [result, categories, decisionLogs]);

  const selectedCategory = manualCategoryId
    ? categories.find(c => c.id === manualCategoryId)
    : autoMatchedCategory;

  const parseInput = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResult(null);
      return;
    }

    setIsProcessing(true);
    try {
      const parsed = await parseNaturalInput(text, today);
      setResult(parsed);
      onParsed(parsed);
    } catch {
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [today, onParsed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      parseInput(input);
    }, 300);

    return () => clearTimeout(timer);
  }, [input, parseInput]);

  const handleUse = () => {
    if (result && result.amount !== null && selectedCategory) {
      const finalResult: NluParseResult = {
        ...result,
        categoryHint: selectedCategory.name,
      };
      onUse(finalResult);
    }
  };

  const canUse = result !== null && result.amount !== null && selectedCategory != null;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try: "Spent 500 on dinner yesterday"'
          className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none min-h-[80px]"
          autoFocus
        />
        {isProcessing && (
          <div className="absolute right-3 top-3">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {result && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          {result.amount !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(result.amount)}</span>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-sm text-gray-500">Category</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const isAutoSuggested = autoMatchedCategory?.id === cat.id && !manualCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setManualCategoryId(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors min-h-[36px] ${
                      isSelected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 active:bg-gray-100'
                    }`}
                  >
                    {cat.name}
                    {isAutoSuggested && <span className="ml-1 text-xs opacity-70">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {result.date && result.date !== today && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Date</span>
              <span className="text-sm text-gray-900">
                {new Date(result.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}

          {result.confidence > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Confidence</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      result.confidence >= 0.7
                        ? 'bg-green-500'
                        : result.confidence >= 0.4
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleUse}
          disabled={!canUse}
          className="flex-1 py-3 bg-gray-900 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-gray-800 min-h-[48px] font-medium"
        >
          Use This
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 min-h-[48px]"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Examples: "uber 200", "lunch at cafe 450", "groceries 1500 yesterday"
      </p>
    </div>
  );
}
