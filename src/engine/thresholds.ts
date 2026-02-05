import type { Category, DecisionLog, ThresholdRecommendation } from '../types';
import { getUniqueMonths } from './patterns';

const MIN_TRANSACTIONS = 10;
const MIN_MONTHS = 3;
const TARGET_WAIT_RATIO = 0.3;

interface SimulationResult {
  threshold: number;
  waitRatio: number;
  noRatio: number;
  yesRatio: number;
}

function simulateDecisionsAtThreshold(
  logs: DecisionLog[],
  categoryBudget: number,
  threshold: number
): SimulationResult {
  let yesCount = 0;
  let waitCount = 0;
  let noCount = 0;

  const monthlySpent = new Map<string, number>();

  for (const log of logs) {
    const monthKey = log.date.substring(0, 7);
    const prevSpent = monthlySpent.get(monthKey) || 0;
    const newTotal = prevSpent + log.amount;

    const graceLimit = categoryBudget * threshold;

    if (newTotal <= graceLimit) {
      yesCount++;
    } else if (newTotal <= categoryBudget) {
      waitCount++;
    } else {
      noCount++;
    }

    monthlySpent.set(monthKey, newTotal);
  }

  const total = yesCount + waitCount + noCount;
  if (total === 0) {
    return { threshold, waitRatio: 0, noRatio: 0, yesRatio: 1 };
  }

  return {
    threshold,
    waitRatio: waitCount / total,
    noRatio: noCount / total,
    yesRatio: yesCount / total,
  };
}

export function findOptimalThreshold(
  logs: DecisionLog[],
  categoryBudget: number
): number {
  if (logs.length < MIN_TRANSACTIONS) return 0.6;

  const thresholds = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
  const results: SimulationResult[] = [];

  for (const threshold of thresholds) {
    results.push(simulateDecisionsAtThreshold(logs, categoryBudget, threshold));
  }

  let bestThreshold = 0.6;
  let bestScore = Infinity;

  for (const result of results) {
    const waitDiff = Math.abs(result.waitRatio - TARGET_WAIT_RATIO);
    const noPenalty = result.noRatio * 2;
    const score = waitDiff + noPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestThreshold = result.threshold;
    }
  }

  return bestThreshold;
}

export function simulateThreshold(
  logs: DecisionLog[],
  categoryBudget: number,
  threshold: number
): { waitRatio: number; catchRate: number } {
  const result = simulateDecisionsAtThreshold(logs, categoryBudget, threshold);

  const catchRate = result.waitRatio + result.noRatio;

  return {
    waitRatio: result.waitRatio,
    catchRate,
  };
}

export function generateThresholdRecommendations(
  logs: DecisionLog[],
  categories: Category[],
  currentGlobalThreshold: number = 0.6
): ThresholdRecommendation[] {
  const recommendations: ThresholdRecommendation[] = [];

  const months = getUniqueMonths(logs);
  if (months.size < MIN_MONTHS) return recommendations;

  const categoryLogs = new Map<string, DecisionLog[]>();
  for (const log of logs) {
    if (!categoryLogs.has(log.categoryId)) {
      categoryLogs.set(log.categoryId, []);
    }
    categoryLogs.get(log.categoryId)!.push(log);
  }

  for (const category of categories) {
    const catLogs = categoryLogs.get(category.id) || [];

    if (catLogs.length < MIN_TRANSACTIONS) continue;

    const currentThreshold = category.graceThreshold ?? currentGlobalThreshold;
    const recommendedThreshold = findOptimalThreshold(catLogs, category.monthlyBudget);

    const diff = Math.abs(recommendedThreshold - currentThreshold);
    if (diff < 0.05) continue;

    const currentSim = simulateThreshold(catLogs, category.monthlyBudget, currentThreshold);
    const recommendedSim = simulateThreshold(catLogs, category.monthlyBudget, recommendedThreshold);

    let reason: string;
    if (recommendedThreshold > currentThreshold) {
      reason = `Increase would reduce WAIT decisions from ${Math.round(currentSim.waitRatio * 100)}% to ${Math.round(recommendedSim.waitRatio * 100)}%`;
    } else {
      reason = `Decrease would catch more overspending (${Math.round(recommendedSim.catchRate * 100)}% vs ${Math.round(currentSim.catchRate * 100)}%)`;
    }

    recommendations.push({
      categoryId: category.id,
      currentThreshold,
      recommendedThreshold,
      reason,
      basedOnMonths: months.size,
    });
  }

  recommendations.sort((a, b) => {
    const aDiff = Math.abs(a.recommendedThreshold - a.currentThreshold);
    const bDiff = Math.abs(b.recommendedThreshold - b.currentThreshold);
    return bDiff - aDiff;
  });

  return recommendations;
}
