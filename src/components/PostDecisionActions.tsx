interface PostDecisionActionsProps {
  onBought: () => void;
  onSkipped: () => void;
}

export function PostDecisionActions({ onBought, onSkipped }: PostDecisionActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onBought}
        className="w-full py-4 text-lg font-semibold bg-gray-900 text-white rounded-lg active:bg-gray-800 min-h-[56px]"
      >
        Bought
      </button>
      <button
        onClick={onSkipped}
        className="w-full py-4 text-lg font-semibold bg-white text-gray-900 border-2 border-gray-900 rounded-lg active:bg-gray-100 min-h-[56px]"
      >
        Skipped
      </button>
    </div>
  );
}
