import type { PredictiveAlert } from '../types';
import { formatCurrency } from '../utils/format';

interface PredictiveAlertCardProps {
  alert: PredictiveAlert;
  categoryName: string;
  onAdjustBudget?: () => void;
}

export function PredictiveAlertCard({
  alert,
  categoryName,
  onAdjustBudget,
}: PredictiveAlertCardProps) {
  const severityStyles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700',
    },
  };

  const styles = severityStyles[alert.severity];

  const typeLabels = {
    OVERSPEND_WARNING: 'Overspend Alert',
    PAYDAY_SPIKE: 'Payday Pattern',
    WEEKEND_PATTERN: 'Weekend Pattern',
  };

  return (
    <div className={`rounded-xl p-4 ${styles.bg} border ${styles.border}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {alert.severity === 'critical' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : alert.severity === 'warning' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{categoryName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${styles.badge}`}>
              {typeLabels[alert.type]}
            </span>
          </div>

          <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

          {alert.predictedOverspendAmount > 0 && (
            <p className="text-xs text-gray-500">
              Projected overspend: {formatCurrency(alert.predictedOverspendAmount)}
            </p>
          )}
        </div>

        {onAdjustBudget && (
          <button
            onClick={() => onAdjustBudget()}
            className="flex-shrink-0 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Adjust
          </button>
        )}
      </div>
    </div>
  );
}
