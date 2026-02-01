interface PostDecisionActionsProps {
  onBought: () => void;
  onSkipped: () => void;
}

export function PostDecisionActions({ onBought, onSkipped }: PostDecisionActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onSkipped}
        className="flex-1 py-4 text-lg font-semibold bg-gray-200 text-gray-700 rounded-lg active:bg-gray-300 min-h-[56px]"
      >
        Skipped
      </button>
      <button
        onClick={onBought}
        className="flex-1 py-4 text-lg font-semibold bg-gray-900 text-white rounded-lg active:bg-gray-800 min-h-[56px]"
      >
        Bought
      </button>
    </div>
  );
}
