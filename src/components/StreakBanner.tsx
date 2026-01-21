interface StreakBannerProps {
  skipStreak: number;
  totalSaved: number;
}

export function StreakBanner({ skipStreak, totalSaved }: StreakBannerProps) {
  if (skipStreak === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
      <p className="text-sm text-green-800">
        You've skipped{' '}
        <span className="font-semibold">{skipStreak}</span>{' '}
        purchase{skipStreak !== 1 ? 's' : ''}, saved{' '}
        <span className="font-semibold">₹{totalSaved.toLocaleString('en-IN')}</span>{' '}
        this month
      </p>
    </div>
  );
}
