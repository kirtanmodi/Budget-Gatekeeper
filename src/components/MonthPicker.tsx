import {
  type MonthYear,
  formatMonthYear,
  getPrevMonth,
  getNextMonth,
  isBeforeMonth,
  isAfterMonth,
  isSameMonth,
} from '../utils/date';

interface MonthPickerProps {
  value: MonthYear;
  onChange: (value: MonthYear) => void;
  minDate?: MonthYear;
  maxDate?: MonthYear;
}

export function MonthPicker({
  value,
  onChange,
  minDate,
  maxDate,
}: MonthPickerProps) {
  const canGoPrev = !minDate || isAfterMonth(value, minDate);
  const canGoNext = !maxDate || isBeforeMonth(value, maxDate);
  const isCurrentMonth = maxDate && isSameMonth(value, maxDate);

  const handlePrev = () => {
    if (canGoPrev) {
      onChange(getPrevMonth(value));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onChange(getNextMonth(value));
    }
  };

  return (
    <div className="flex items-center justify-between bg-gray-100 rounded-lg px-2 py-1 mb-4">
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canGoPrev}
        className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
          canGoPrev
            ? 'text-gray-700 active:bg-gray-200'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        aria-label="Previous month"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      <div className="flex-1 text-center">
        <span className="font-medium text-gray-900">
          {formatMonthYear(value.year, value.month)}
        </span>
        {isCurrentMonth && (
          <span className="ml-2 text-xs text-gray-500">(Current)</span>
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canGoNext}
        className={`p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${
          canGoNext
            ? 'text-gray-700 active:bg-gray-200'
            : 'text-gray-300 cursor-not-allowed'
        }`}
        aria-label="Next month"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
