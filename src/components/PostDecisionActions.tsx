interface PostDecisionActionsProps {
  onBought: () => void;
  onSkipped: () => void;
}

export function PostDecisionActions({ onBought }: PostDecisionActionsProps) {
  return (
    <button
      onClick={onBought}
      className="w-full py-4 text-lg font-semibold bg-gray-900 text-white rounded-lg active:bg-gray-800 min-h-[56px]"
    >
      Bought
    </button>
  );
}
