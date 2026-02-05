import type { ThresholdRecommendation as ThresholdRecommendationType } from '../types';

interface ThresholdRecommendationProps {
  recommendation: ThresholdRecommendationType;
  categoryName: string;
  onApply: (categoryId: string, threshold: number) => void;
  onDismiss: (categoryId: string) => void;
}

export function ThresholdRecommendation({
  recommendation,
  categoryName,
  onApply,
  onDismiss,
}: ThresholdRecommendationProps) {
  const currentPercent = Math.round(recommendation.currentThreshold * 100);
  const recommendedPercent = Math.round(recommendation.recommendedThreshold * 100);
  const isIncrease = recommendation.recommendedThreshold > recommendation.currentThreshold;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-blue-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{categoryName}</p>
          <p className="text-sm text-gray-600 mt-1">
            Suggested: {currentPercent}% → {recommendedPercent}%
            {isIncrease ? ' (more lenient)' : ' (stricter)'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{recommendation.reason}</p>
          <p className="text-xs text-gray-400 mt-1">
            Based on {recommendation.basedOnMonths} months of data
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onApply(recommendation.categoryId, recommendation.recommendedThreshold)}
          className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg active:bg-blue-700"
        >
          Apply
        </button>
        <button
          onClick={() => onDismiss(recommendation.categoryId)}
          className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-700"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
