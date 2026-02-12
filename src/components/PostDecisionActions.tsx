interface PostDecisionActionsProps {
  onBought: () => void;
  onSkipped: () => void;
}

export function PostDecisionActions({ onBought, onSkipped }: PostDecisionActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onSkipped}
        className="flex-1 py-4 text-lg font-semibold bg-gray-200 text-gray-700 rounded-xl active:bg-gray-300 min-h-[56px] flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Skip
      </button>
      <button
        onClick={onBought}
        className="flex-1 py-4 text-lg font-semibold bg-nf-red text-white rounded-xl active:bg-nf-red-dark min-h-[56px] flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Bought
      </button>
    </div>
  );
}
