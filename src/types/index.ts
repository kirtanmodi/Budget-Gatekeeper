export interface Category {
  id: string;
  name: string;
  monthlyBudget: number;
  currentSpent: number;
  graceThreshold?: number;
  keywords?: string[];
}

export interface DecisionLog {
  id: string;
  categoryId: string;
  amount: number;
  decision: 'YES' | 'WAIT' | 'NO';
  waitDays?: number;
  date: string;
  timestamp?: string;
  description?: string;
}

export interface SystemState {
  today: string;
}

export interface Settings {
  graceThreshold: number;
  enableSmartCategorization?: boolean;
  enablePredictiveAlerts?: boolean;
  enableNluInput?: boolean;
  enablePersonalizedThresholds?: boolean;
}

export interface BudgetState {
  categories: Category[];
  currentPeriod: { month: number; year: number } | null;
  decisionLogs: DecisionLog[];
  archivedLogs: DecisionLog[];
  system: SystemState;
  lastUsedCategoryId: string | null;
  settings: Settings;
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

export interface NluParseResult {
  amount: number | null;
  categoryHint: string | null;
  date: string | null;
  confidence: number;
  rawInput: string;
}

export type PredictiveAlertType =
  | 'OVERSPEND_WARNING'
  | 'PAYDAY_SPIKE'
  | 'WEEKEND_PATTERN';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface PredictiveAlert {
  id: string;
  categoryId: string;
  type: PredictiveAlertType;
  predictedOverspendDate: string | null;
  predictedOverspendAmount: number;
  message: string;
  severity: AlertSeverity;
}

export interface SpendingPattern {
  categoryId: string;
  weekdayAvg: number;
  weekendAvg: number;
  firstWeekAvg: number;
  midMonthAvg: number;
  endMonthAvg: number;
  volatility: number;
}

export interface ThresholdRecommendation {
  categoryId: string;
  currentThreshold: number;
  recommendedThreshold: number;
  reason: string;
  basedOnMonths: number;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
}
