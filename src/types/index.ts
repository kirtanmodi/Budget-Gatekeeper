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
