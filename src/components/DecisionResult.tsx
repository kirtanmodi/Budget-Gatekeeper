import type { Decision } from '../types';

interface DecisionResultProps {
  decision: Decision;
  today: string;
}

export function DecisionResult({ decision, today }: DecisionResultProps) {
  if (decision.type === 'YES') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-5xl font-bold text-gray-900">YES</span>
      </div>
    );
  }

  if (decision.type === 'WAIT') {
    const buyDate = new Date(today);
    buyDate.setDate(buyDate.getDate() + decision.days);
    const formattedBuyDate = buyDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-5xl font-bold text-gray-900">WAIT</span>
        <span className="text-2xl text-gray-600 mt-2">
          {decision.days} day{decision.days !== 1 ? 's' : ''}
        </span>
        <span className="text-lg text-gray-500 mt-1">
          Buy on {formattedBuyDate}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <span className="text-5xl font-bold text-gray-900">NO</span>
    </div>
  );
}
