import type { ContextInfo } from '../types';

interface ContextMessageProps {
  context: ContextInfo;
  categoryName: string;
}

export function ContextMessage({ context, categoryName }: ContextMessageProps) {
  const { usedPercent, weeksLeft, daysLeft, remainingPerWeek, remainingPerDay, spent, budget, remaining } = context;

  return (
    <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
      <p className="font-medium text-gray-900 mb-3">{categoryName}</p>
      
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">Spent</p>
          <p className="font-semibold">₹{Math.round(spent).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="font-semibold">₹{Math.round(budget).toLocaleString('en-IN')}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className={`font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
            ₹{Math.round(remaining).toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Used</p>
          <p className="font-semibold">{usedPercent.toFixed(0)}%</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 space-y-1">
        <p>
          <span className="font-semibold">{daysLeft}</span> day{daysLeft !== 1 ? 's' : ''} left ({weeksLeft} week{weeksLeft !== 1 ? 's' : ''})
        </p>
        <p>
          <span className="font-semibold">₹{Math.round(remainingPerDay).toLocaleString('en-IN')}</span>/day or{' '}
          <span className="font-semibold">₹{Math.round(remainingPerWeek).toLocaleString('en-IN')}</span>/week
        </p>
      </div>
    </div>
  );
}
