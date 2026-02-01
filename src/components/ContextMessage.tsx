import type { ContextInfo } from '../types';
import { getZone } from '../engine/decision';
import { zoneLabels, zoneStyles } from '../constants/zones';
import { formatCurrency, pluralize } from '../utils/format';

interface ContextMessageProps {
  context: ContextInfo;
  categoryName: string;
}

export function ContextMessage({ context, categoryName }: ContextMessageProps) {
  const { usedPercent, weeksLeft, daysLeft, remainingPerWeek, remainingPerDay, spent, budget, remaining } = context;
  const zone = getZone(spent, budget);

  return (
    <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
      <p className="text-xs text-gray-500 mb-2">Current status (before this purchase)</p>
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-gray-900">{categoryName}</p>
        <span className={`px-2 py-1 text-xs font-medium rounded ${zoneStyles[zone].badge}`}>
          {zoneLabels[zone]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <p className="text-xs text-gray-500">Spent</p>
          <p className="font-semibold">{formatCurrency(spent)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Budget</p>
          <p className="font-semibold">{formatCurrency(budget)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Remaining</p>
          <p className={`font-semibold ${remaining < 0 ? 'text-red-600' : ''}`}>
            {formatCurrency(remaining)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Used</p>
          <p className="font-semibold">{usedPercent.toFixed(0)}%</p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3 space-y-1">
        <p>
          <span className="font-semibold">{daysLeft}</span> {pluralize(daysLeft, 'day')} left ({weeksLeft} {pluralize(weeksLeft, 'week')})
        </p>
        <p>
          <span className="font-semibold">{formatCurrency(remainingPerDay)}</span>/day or{' '}
          <span className="font-semibold">{formatCurrency(remainingPerWeek)}</span>/week
        </p>
      </div>

      {zone !== 'FREE' && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs text-gray-500">
            {zone === 'CONTROL'
              ? "You've crossed the 80% buffer. Every purchase now tightens your runway."
              : "You're over budget. Purchases will create negative balance."}
          </p>
        </div>
      )}
    </div>
  );
}
