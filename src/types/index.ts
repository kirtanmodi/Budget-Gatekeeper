export interface Category {
  id: string;
  name: string;
  monthlyBudget: number;
  currentSpent: number;
}

export interface DecisionLog {
  id: string;
  categoryId: string;
  amount: number;
  decision: 'YES' | 'WAIT' | 'NO';
  waitDays?: number;
  date: string;
}

export interface SystemState {
  today: string;
}

export interface BudgetState {
  categories: Category[];
  currentPeriod: { month: number; year: number } | null;
  decisionLogs: DecisionLog[];
  archivedLogs: DecisionLog[];
  system: SystemState;
  lastUsedCategoryId: string | null;
}

export type DecisionReason =
  | { code: 'GRACE'; usedPercent: number }
  | { code: 'ON_PACE'; allowedPercent: number }
  | { code: 'OVER_PACE'; allowedPercent: number; totalPercent: number }
  | { code: 'OVER_BUDGET' };

export type Decision =
  | { type: 'YES'; reason: DecisionReason }
  | { type: 'WAIT'; days: number; reason: DecisionReason }
  | { type: 'NO'; reason: DecisionReason };

export interface ContextInfo {
  usedPercent: number;
  weeksLeft: number;
  daysLeft: number;
  remainingPerWeek: number;
  remainingPerDay: number;
  spent: number;
  budget: number;
  remaining: number;
}

export type SuggestionType =
  | 'BUDGET_INCREASE'
  | 'BUDGET_DECREASE'
  | 'PACE_WARNING'
  | 'SURPLUS'
  | 'ON_TRACK';

export type SuggestionSeverity = 'info' | 'warning' | 'success';

export interface SuggestionAction {
  label: string;
  type: 'UPDATE_BUDGET';
  categoryId: string;
  amount: number;
}

export interface Suggestion {
  id: string;
  type: SuggestionType;
  severity: SuggestionSeverity;
  categoryId?: string;
  title: string;
  description: string;
  action?: SuggestionAction;
}

export interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  totalTransactions: number;
  yesCount: number;
  waitCount: number;
  noCount: number;
  waitRatio: number;
  budget: number;
  spent: number;
  usedPercent: number;
}

export interface PaceProjection {
  categoryId: string;
  categoryName: string;
  projectedEndSpend: number;
  budget: number;
  projectedDelta: number;
  isOverspending: boolean;
}

export interface ForecastDataPoint {
  day: number;
  actual: number | null;
  projected: number;
  budget: number;
}

export interface ForecastData {
  points: ForecastDataPoint[];
  totalBudget: number;
  currentDay: number;
  daysInMonth: number;
  projectedEndSpend: number;
  isOverspending: boolean;
}
