import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { getDaysInMonth, getZone, type Zone } from '../engine/decision';
import { StreakBanner } from '../components/StreakBanner';

const zoneLabels: Record<Zone, string> = {
  FREE: 'Free Zone',
  CONTROL: 'Control Zone',
  STOP: 'Over Budget',
};

const zoneStyles: Record<Zone, { badge: string; bar: string }> = {
  FREE: { badge: 'bg-gray-200 text-gray-700', bar: 'bg-gray-400' },
  CONTROL: { badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' },
  STOP: { badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
};

export function DashboardPage() {
  const categories = useAppSelector((state) => state.budget.categories);
  const today = useAppSelector((state) => state.budget.system.today);
  const skipStreak = useAppSelector((state) => state.budget.skipStreak);
  const totalSavedThisMonth = useAppSelector((state) => state.budget.totalSavedThisMonth);

  const todayDate = useMemo(() => new Date(today), [today]);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(todayDate.getFullYear(), todayDate.getMonth());
  const daysLeft = daysInMonth - currentDay;

  const totalBudget = categories.reduce((sum, c) => sum + c.monthlyBudget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.currentSpent, 0);
  const totalRemaining = totalBudget - totalSpent;

  const formattedDate = todayDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col min-h-screen pb-20 px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {formattedDate} — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </p>
      </div>

      <StreakBanner skipStreak={skipStreak} totalSaved={totalSavedThisMonth} />

      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">Spent</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{totalSpent.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹{totalBudget.toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={`text-lg font-semibold ${totalRemaining < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ₹{totalRemaining.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {categories.map((category) => {
          const zone = getZone(category.currentSpent, category.monthlyBudget);
          const percent = category.monthlyBudget > 0
            ? Math.min(100, (category.currentSpent / category.monthlyBudget) * 100)
            : 0;
          const remaining = category.monthlyBudget - category.currentSpent;

          return (
            <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{category.name}</p>
                <span className={`px-2 py-1 text-xs font-medium rounded ${zoneStyles[zone].badge}`}>
                  {zoneLabels[zone]}
                </span>
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>₹{category.currentSpent.toLocaleString('en-IN')} spent</span>
                <span className={remaining < 0 ? 'text-red-600' : ''}>
                  ₹{remaining.toLocaleString('en-IN')} left
                </span>
              </div>

              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${zoneStyles[zone].bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2 text-right">
                of ₹{category.monthlyBudget.toLocaleString('en-IN')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
