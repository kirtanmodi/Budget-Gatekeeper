import type { Decision } from '../types';

interface WaitContext {
  remainingAfterPurchase: number;
  daysLeftAfterPurchase: number;
  weeksLeftAfterPurchase: number;
  currentDailyRate: number;
}

interface DecisionResultProps {
  decision: Decision;
  today: string;
  waitContext?: WaitContext;
}

export function DecisionResult({ decision, today, waitContext }: DecisionResultProps) {
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
        {waitContext && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              You'll have{' '}
              <span className="font-semibold">
                ₹{Math.round(waitContext.remainingAfterPurchase).toLocaleString('en-IN')}
              </span>{' '}
              left for {waitContext.daysLeftAfterPurchase} day{waitContext.daysLeftAfterPurchase !== 1 ? 's' : ''}{' '}
              ({waitContext.weeksLeftAfterPurchase} week{waitContext.weeksLeftAfterPurchase !== 1 ? 's' : ''})
            </p>
            {(() => {
              const improvedDailyRate = waitContext.remainingAfterPurchase / waitContext.daysLeftAfterPurchase;
              const improvement = improvedDailyRate - waitContext.currentDailyRate;
              if (improvement > 0) {
                return (
                  <p className="text-xs text-green-700 mt-2">
                    ₹{Math.round(improvedDailyRate).toLocaleString('en-IN')}/day vs ₹{Math.round(waitContext.currentDailyRate).toLocaleString('en-IN')}/day if you buy today
                  </p>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <span className="text-5xl font-bold text-gray-900">NO</span>
    </div>
  );
}
