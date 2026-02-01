import type { Decision } from '../types';
import { formatCurrency, pluralize } from '../utils/format';

interface DecisionResultProps {
  decision: Decision;
  amount: number;
  categoryName: string;
  today: string;
}

export function DecisionResult({ decision, amount, categoryName, today }: DecisionResultProps) {
  if (decision.type === 'YES') {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-4xl font-bold text-emerald-600">Go ahead</span>
        <p className="text-lg text-gray-600 mt-3">
          {formatCurrency(amount)} for {categoryName}
        </p>
      </div>
    );
  }

  if (decision.type === 'WAIT') {
    const buyDate = new Date(today);
    buyDate.setDate(buyDate.getDate() + decision.days);
    const formattedBuyDate = buyDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-4xl font-bold text-amber-600">
          Wait {decision.days} {pluralize(decision.days, 'day')}
        </span>
        <p className="text-lg text-gray-600 mt-3">
          {formatCurrency(amount)} for {categoryName}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Buy on {formattedBuyDate}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span className="text-4xl font-bold text-red-600">Over budget</span>
      <p className="text-lg text-gray-600 mt-3">
        {formatCurrency(amount)} for {categoryName}
      </p>
    </div>
  );
}
