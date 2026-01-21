import type { Decision } from '../types';

interface DecisionResultProps {
  decision: Decision;
}

export function DecisionResult({ decision }: DecisionResultProps) {
  if (decision.type === 'YES') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-5xl font-bold text-gray-900">YES</span>
      </div>
    );
  }

  if (decision.type === 'WAIT') {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <span className="text-5xl font-bold text-gray-900">WAIT</span>
        <span className="text-2xl text-gray-600 mt-2">
          {decision.days} day{decision.days !== 1 ? 's' : ''}
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
