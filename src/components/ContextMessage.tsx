import type { ContextInfo } from '../types';
import { getZone, type Zone } from '../engine/decision';

interface ContextMessageProps {
  context: ContextInfo;
  categoryName: string;
}

const zoneLabels: Record<Zone, string> = {
  FREE: 'Free Zone',
  CONTROL: 'Control Zone',
  STOP: 'Over Budget',
};

const zoneStyles: Record<Zone, string> = {
  FREE: 'bg-gray-200 text-gray-700',
  CONTROL: 'bg-yellow-100 text-yellow-800',
  STOP: 'bg-red-100 text-red-800',
};

export function ContextMessage({ context, categoryName }: ContextMessageProps) {
  const { usedPercent, weeksLeft, daysLeft, remainingPerWeek, remainingPerDay, spent, budget, remaining } = context;
  const zone = getZone(spent, budget);

  return (
    <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700">
      <div className="flex items-center justify-between mb-3">
        <p className="font-medium text-gray-900">{categoryName}</p>
        <span className={`px-2 py-1 text-xs font-medium rounded ${zoneStyles[zone]}`}>
          {zoneLabels[zone]}
        </span>
      </div>
      
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
