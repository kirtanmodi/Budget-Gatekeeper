import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BudgetState, DecisionLog, MonthSnapshot } from '../types';
import { defaultCategories } from '../data/defaultCategories';

const getInitialToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const initialState: BudgetState = {
  categories: defaultCategories,
  currentSnapshot: null,
  decisionLogs: [],
  archivedLogs: [],
  system: {
    today: getInitialToday(),
  },
  lastUsedCategoryId: null,
  skipStreak: 0,
  totalSavedThisMonth: 0,
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    logDecision: (
      state,
      action: PayloadAction<{
        categoryId: string;
        amount: number;
        decision: 'YES' | 'WAIT' | 'NO';
        waitDays?: number;
        action: 'BOUGHT' | 'SKIPPED';
      }>
    ) => {
      const { categoryId, amount, decision, waitDays, action: userAction } = action.payload;
      const log: DecisionLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        categoryId,
        amount,
        decision,
        waitDays,
        action: userAction,
        date: state.system.today,
      };
      state.decisionLogs.push(log);

      if (userAction === 'BOUGHT') {
        const category = state.categories.find((c) => c.id === categoryId);
        if (category) {
          category.currentSpent += amount;
        }
        state.skipStreak = 0;
      } else {
        state.skipStreak += 1;
        state.totalSavedThisMonth += amount;
      }
    },

    setLastUsedCategory: (state, action: PayloadAction<string>) => {
      state.lastUsedCategoryId = action.payload;
    },

    undoLastDecision: (state) => {
      const lastLog = state.decisionLogs[state.decisionLogs.length - 1];
      if (!lastLog) return;

      if (lastLog.action === 'BOUGHT') {
        const category = state.categories.find((c) => c.id === lastLog.categoryId);
        if (category) {
          category.currentSpent -= lastLog.amount;
        }
      } else {
        state.skipStreak = Math.max(0, state.skipStreak - 1);
        state.totalSavedThisMonth = Math.max(0, state.totalSavedThisMonth - lastLog.amount);
      }

      state.decisionLogs.pop();
    },

    setSpent: (
      state,
      action: PayloadAction<{ categoryId: string; amount: number }>
    ) => {
      const { categoryId, amount } = action.payload;
      const category = state.categories.find((c) => c.id === categoryId);
      if (category) {
        category.currentSpent = amount;
      }
    },

    updateBudget: (
      state,
      action: PayloadAction<{ categoryId: string; newBudget: number }>
    ) => {
      const { categoryId, newBudget } = action.payload;
      const category = state.categories.find((c) => c.id === categoryId);
      if (category) {
        category.monthlyBudget = newBudget;
      }
    },

    startNewMonth: (state) => {
      state.archivedLogs = [...state.archivedLogs, ...state.decisionLogs];
      state.decisionLogs = [];

      state.categories.forEach((category) => {
        category.currentSpent = 0;
      });

      const today = new Date(state.system.today);
      const snapshot: MonthSnapshot = {
        month: today.getMonth(),
        year: today.getFullYear(),
        categories: state.categories.map((c) => ({
          id: c.id,
          name: c.name,
          monthlyBudget: c.monthlyBudget,
        })),
      };
      state.currentSnapshot = snapshot;
    },

    syncToday: (state, action: PayloadAction<string>) => {
      const newToday = action.payload;
      const newDate = new Date(newToday);

      state.system.today = newToday;

      if (
        state.currentSnapshot &&
        (newDate.getMonth() !== state.currentSnapshot.month ||
          newDate.getFullYear() !== state.currentSnapshot.year)
      ) {
        state.archivedLogs = [...state.archivedLogs, ...state.decisionLogs];
        state.decisionLogs = [];
        state.categories.forEach((category) => {
          category.currentSpent = 0;
        });
        state.skipStreak = 0;
        state.totalSavedThisMonth = 0;
        state.currentSnapshot = {
          month: newDate.getMonth(),
          year: newDate.getFullYear(),
          categories: state.categories.map((c) => ({
            id: c.id,
            name: c.name,
            monthlyBudget: c.monthlyBudget,
          })),
        };
      }

      if (!state.currentSnapshot) {
        state.currentSnapshot = {
          month: newDate.getMonth(),
          year: newDate.getFullYear(),
          categories: state.categories.map((c) => ({
            id: c.id,
            name: c.name,
            monthlyBudget: c.monthlyBudget,
          })),
        };
      }
    },

    resetAllSpent: (state) => {
      state.categories.forEach((category) => {
        category.currentSpent = 0;
      });
    },

    resetToDefaults: (state) => {
      state.categories = defaultCategories;
      state.decisionLogs = [];
      state.currentSnapshot = null;
    },

    updateTransaction: (
      state,
      action: PayloadAction<{ id: string; newAmount: number }>
    ) => {
      const { id, newAmount } = action.payload;
      const log = state.decisionLogs.find((l) => l.id === id);
      if (log && log.action === 'BOUGHT') {
        const category = state.categories.find((c) => c.id === log.categoryId);
        if (category) {
          category.currentSpent = category.currentSpent - log.amount + newAmount;
        }
        log.amount = newAmount;
      }
    },

    deleteTransaction: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const log = state.decisionLogs.find((l) => l.id === id);
      if (log && log.action === 'BOUGHT') {
        const category = state.categories.find((c) => c.id === log.categoryId);
        if (category) {
          category.currentSpent -= log.amount;
        }
      }
      state.decisionLogs = state.decisionLogs.filter((l) => l.id !== id);
    },
  },
});

export const { logDecision, setSpent, updateBudget, startNewMonth, syncToday, resetAllSpent, resetToDefaults, updateTransaction, deleteTransaction, setLastUsedCategory, undoLastDecision } =
  budgetSlice.actions;
export default budgetSlice.reducer;
