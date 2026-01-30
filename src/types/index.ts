export interface CategorySnapshot {
  id: string;
  name: string;
  monthlyBudget: number;
}

export interface MonthSnapshot {
  month: number;
  year: number;
  categories: CategorySnapshot[];
}

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
  currentSnapshot: MonthSnapshot | null;
  decisionLogs: DecisionLog[];
  archivedLogs: DecisionLog[];
  system: SystemState;
  lastUsedCategoryId: string | null;
}

export type Decision =
  | { type: 'YES' }
  | { type: 'WAIT'; days: number }
  | { type: 'NO' };

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
  | 'REALLOCATION'
  | 'PACE_WARNING'
  | 'SURPLUS'
  | 'ON_TRACK';

export type SuggestionSeverity = 'info' | 'warning' | 'success';

export interface SuggestionAction {
  label: string;
  type: 'UPDATE_BUDGET' | 'REALLOCATE';
  categoryId: string;
  amount: number;
  targetCategoryId?: string;
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
