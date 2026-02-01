import type {
  BudgetState,
  Category,
  DecisionLog,
  Suggestion,
  CategoryAnalysis,
  PaceProjection,
} from '../types';
import { getDaysInMonth } from './decision';
import { getEffectiveBudget } from '../store/budgetSlice';
import { formatCurrency } from '../utils/format';

const WAIT_RATIO_THRESHOLD = 0.4;
const UNDERUTILIZED_THRESHOLD = 0.5;
const PACE_WARNING_THRESHOLD = 1.1;

function analyzeDecisionOutcomes(
  logs: DecisionLog[],
  categories: Category[]
): CategoryAnalysis[] {
  const analysisMap = new Map<string, CategoryAnalysis>();

  for (const category of categories) {
    const effectiveBudget = getEffectiveBudget(category);
    analysisMap.set(category.id, {
      categoryId: category.id,
      categoryName: category.name,
      totalTransactions: 0,
      yesCount: 0,
      waitCount: 0,
      noCount: 0,
      waitRatio: 0,
      budget: effectiveBudget,
      spent: category.currentSpent,
      usedPercent:
        effectiveBudget > 0
          ? (category.currentSpent / effectiveBudget) * 100
          : 0,
    });
  }

  for (const log of logs) {
    const analysis = analysisMap.get(log.categoryId);
    if (!analysis) continue;

    analysis.totalTransactions++;
    if (log.decision === 'YES') analysis.yesCount++;
    else if (log.decision === 'WAIT') analysis.waitCount++;
    else if (log.decision === 'NO') analysis.noCount++;
  }

  for (const analysis of analysisMap.values()) {
    if (analysis.totalTransactions > 0) {
      analysis.waitRatio =
        (analysis.waitCount + analysis.noCount) / analysis.totalTransactions;
    }
  }

  return Array.from(analysisMap.values());
}

export function calculatePaceProjections(
  categories: Category[],
  currentDay: number,
  daysInMonth: number
): PaceProjection[] {
  if (currentDay <= 0) return [];

  return categories.map((category) => {
    const effectiveBudget = getEffectiveBudget(category);
    const dailyBurnRate = category.currentSpent / currentDay;
    const projectedEndSpend = dailyBurnRate * daysInMonth;
    const projectedDelta = effectiveBudget - projectedEndSpend;

    return {
      categoryId: category.id,
      categoryName: category.name,
      projectedEndSpend,
      budget: effectiveBudget,
      projectedDelta,
      isOverspending: projectedEndSpend > effectiveBudget,
    };
  });
}

function createBudgetIncreaseSuggestion(
  analysis: CategoryAnalysis
): Suggestion {
  const suggestedIncrease = Math.ceil(analysis.budget * 0.2 / 1000) * 1000;

  return {
    id: `budget-increase-${analysis.categoryId}`,
    type: 'BUDGET_INCREASE',
    severity: 'warning',
    categoryId: analysis.categoryId,
    title: `${analysis.categoryName} budget seems tight`,
    description: `${analysis.waitCount + analysis.noCount} of ${analysis.totalTransactions} purchases required WAIT or NO. Consider increasing the budget.`,
    action: {
      label: `Increase by ${formatCurrency(suggestedIncrease)}`,
      type: 'UPDATE_BUDGET',
      categoryId: analysis.categoryId,
      amount: analysis.budget + suggestedIncrease,
    },
  };
}

function createPaceWarningSuggestion(projection: PaceProjection): Suggestion {
  const overspendAmount = Math.abs(Math.round(projection.projectedDelta));

  return {
    id: `pace-warning-${projection.categoryId}`,
    type: 'PACE_WARNING',
    severity: 'warning',
    categoryId: projection.categoryId,
    title: `${projection.categoryName} on track to overspend`,
    description: `At current pace, you'll exceed budget by ${formatCurrency(overspendAmount)} this month.`,
  };
}

function createUnderutilizedSuggestion(
  analysis: CategoryAnalysis,
  currentDay: number,
  daysInMonth: number
): Suggestion | null {
  const midpoint = daysInMonth / 2;
  if (currentDay < midpoint) return null;

  const unusedAmount = Math.round(analysis.budget - analysis.spent);
  if (unusedAmount <= 0) return null;

  return {
    id: `underutilized-${analysis.categoryId}`,
    type: 'BUDGET_DECREASE',
    severity: 'info',
    categoryId: analysis.categoryId,
    title: `${analysis.categoryName} has room`,
    description: `Only ${Math.round(analysis.usedPercent)}% used with ${daysInMonth - currentDay} days left. ${formatCurrency(unusedAmount)} could be reallocated.`,
  };
}

function createReallocationSuggestion(
  fromAnalysis: CategoryAnalysis,
  toAnalysis: CategoryAnalysis
): Suggestion {
  const transferAmount =
    Math.ceil(Math.min(
      fromAnalysis.budget - fromAnalysis.spent,
      toAnalysis.budget * 0.2
    ) / 1000) * 1000;

  return {
    id: `reallocation-${fromAnalysis.categoryId}-${toAnalysis.categoryId}`,
    type: 'REALLOCATION',
    severity: 'info',
    categoryId: fromAnalysis.categoryId,
    title: `Move budget to ${toAnalysis.categoryName}?`,
    description: `${fromAnalysis.categoryName} is underspent while ${toAnalysis.categoryName} is tight. Consider moving ${formatCurrency(transferAmount)}.`,
    action: {
      label: `Move ${formatCurrency(transferAmount)}`,
      type: 'REALLOCATE',
      categoryId: fromAnalysis.categoryId,
      amount: transferAmount,
      targetCategoryId: toAnalysis.categoryId,
    },
  };
}

function createSurplusSuggestion(
  totalProjectedSavings: number
): Suggestion {
  return {
    id: 'surplus-forecast',
    type: 'SURPLUS',
    severity: 'success',
    title: 'On track to save',
    description: `Projected surplus of ${formatCurrency(totalProjectedSavings)} this month. Keep it up!`,
  };
}

function createOnTrackSuggestion(): Suggestion {
  return {
    id: 'on-track',
    type: 'ON_TRACK',
    severity: 'success',
    title: 'Looking good!',
    description: 'All categories are within healthy spending ranges.',
  };
}

export function generateSuggestions(state: BudgetState): Suggestion[] {
  const { categories, decisionLogs, system } = state;
  const suggestions: Suggestion[] = [];

  if (categories.length === 0) return suggestions;

  const todayDate = new Date(system.today);
  const currentDay = todayDate.getDate();
  const daysInMonth = getDaysInMonth(
    todayDate.getFullYear(),
    todayDate.getMonth()
  );

  const analyses = analyzeDecisionOutcomes(decisionLogs, categories);
  const projections = calculatePaceProjections(categories, currentDay, daysInMonth);

  const tightCategories: CategoryAnalysis[] = [];
  const underutilizedCategories: CategoryAnalysis[] = [];

  for (const analysis of analyses) {
    if (
      analysis.totalTransactions >= 3 &&
      analysis.waitRatio >= WAIT_RATIO_THRESHOLD
    ) {
      suggestions.push(createBudgetIncreaseSuggestion(analysis));
      tightCategories.push(analysis);
    }

    const midpoint = daysInMonth / 2;
    if (
      currentDay >= midpoint &&
      analysis.usedPercent < UNDERUTILIZED_THRESHOLD * 100
    ) {
      const suggestion = createUnderutilizedSuggestion(
        analysis,
        currentDay,
        daysInMonth
      );
      if (suggestion) {
        underutilizedCategories.push(analysis);
      }
    }
  }

  for (const projection of projections) {
    if (
      projection.isOverspending &&
      projection.projectedEndSpend / projection.budget >= PACE_WARNING_THRESHOLD
    ) {
      const alreadySuggested = suggestions.some(
        (s) =>
          s.categoryId === projection.categoryId &&
          s.type === 'BUDGET_INCREASE'
      );
      if (!alreadySuggested) {
        suggestions.push(createPaceWarningSuggestion(projection));
      }
    }
  }

  if (underutilizedCategories.length > 0 && tightCategories.length > 0) {
    const bestUnderutilized = underutilizedCategories.sort(
      (a, b) => a.usedPercent - b.usedPercent
    )[0];
    const mostTight = tightCategories.sort(
      (a, b) => b.waitRatio - a.waitRatio
    )[0];

    suggestions.push(
      createReallocationSuggestion(bestUnderutilized, mostTight)
    );
  }

  const totalProjectedSavings = projections.reduce(
    (sum, p) => sum + Math.max(0, p.projectedDelta),
    0
  );
  const anyOverspending = projections.some((p) => p.isOverspending);

  if (!anyOverspending && totalProjectedSavings > 0 && currentDay >= 7) {
    suggestions.push(createSurplusSuggestion(Math.round(totalProjectedSavings)));
  }

  if (suggestions.length === 0 && decisionLogs.length > 0) {
    suggestions.push(createOnTrackSuggestion());
  }

  return suggestions;
}

export function getDecisionStats(logs: DecisionLog[]): {
  total: number;
  yes: number;
  wait: number;
  no: number;
} {
  return logs.reduce(
    (acc, log) => {
      acc.total++;
      if (log.decision === 'YES') acc.yes++;
      else if (log.decision === 'WAIT') acc.wait++;
      else if (log.decision === 'NO') acc.no++;
      return acc;
    },
    { total: 0, yes: 0, wait: 0, no: 0 }
  );
}
