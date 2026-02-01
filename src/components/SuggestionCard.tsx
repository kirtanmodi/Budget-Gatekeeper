import { useState } from 'react';
import type { Suggestion, SuggestionSeverity, SuggestionType } from '../types';

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction?: (suggestion: Suggestion, permanent: boolean) => void;
  onDismiss?: (suggestion: Suggestion) => void;
}

const severityStyles: Record<SuggestionSeverity, { bg: string; border: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
};

function SuggestionIcon({ type, severity }: { type: SuggestionType; severity: SuggestionSeverity }) {
  const colorClass = severityStyles[severity].icon;

  switch (type) {
    case 'BUDGET_INCREASE':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'BUDGET_DECREASE':
    case 'REALLOCATION':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'PACE_WARNING':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'SURPLUS':
    case 'ON_TRACK':
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className={`w-5 h-5 ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export function SuggestionCard({ suggestion, onAction, onDismiss }: SuggestionCardProps) {
  const styles = severityStyles[suggestion.severity];
  const [isPermanent, setIsPermanent] = useState(false);

  const showScopeToggle = suggestion.action && onAction;

  return (
    <div className={`${styles.bg} ${styles.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <SuggestionIcon type={suggestion.type} severity={suggestion.severity} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900">{suggestion.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>

          {showScopeToggle && (
            <div className="flex items-center gap-4 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`scope-${suggestion.id}`}
                  checked={!isPermanent}
                  onChange={() => setIsPermanent(false)}
                  className="w-4 h-4 text-gray-900"
                />
                <span className="text-sm text-gray-700">This month only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={`scope-${suggestion.id}`}
                  checked={isPermanent}
                  onChange={() => setIsPermanent(true)}
                  className="w-4 h-4 text-gray-900"
                />
                <span className="text-sm text-gray-700">Permanently</span>
              </label>
            </div>
          )}

          {(suggestion.action || onDismiss) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {suggestion.action && onAction && (
                <button
                  onClick={() => onAction(suggestion, isPermanent)}
                  className="px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md active:bg-gray-700 min-h-[44px]"
                >
                  {suggestion.action.label}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(suggestion)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 active:text-gray-900 min-h-[44px]"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
