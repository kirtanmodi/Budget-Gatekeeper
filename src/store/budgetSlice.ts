import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BudgetState, DecisionLog } from '../types';
import { defaultCategories } from '../data/defaultCategories';

const getInitialToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

const initialState: BudgetState = {
  categories: defaultCategories,
  currentPeriod: null,
  decisionLogs: [],
  archivedLogs: [],
  system: {
    today: getInitialToday(),
  },
  lastUsedCategoryId: null,
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
      }>
    ) => {
      const { categoryId, amount, decision, waitDays } = action.payload;
      const log: DecisionLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        categoryId,
        amount,
        decision,
        waitDays,
        date: state.system.today,
      };
      state.decisionLogs.push(log);

      const category = state.categories.find((c) => c.id === categoryId);
      if (category) {
        category.currentSpent += amount;
      }
    },

    setLastUsedCategory: (state, action: PayloadAction<string>) => {
      state.lastUsedCategoryId = action.payload;
    },

    undoLastDecision: (state) => {
      const lastLog = state.decisionLogs[state.decisionLogs.length - 1];
      if (!lastLog) return;

      const category = state.categories.find((c) => c.id === lastLog.categoryId);
      if (category) {
        category.currentSpent -= lastLog.amount;
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

    syncToday: (state, action: PayloadAction<string>) => {
      const newToday = action.payload;
      const newDate = new Date(newToday);
      const newMonth = newDate.getMonth();
      const newYear = newDate.getFullYear();

      state.system.today = newToday;

      if (
        state.currentPeriod &&
        (newMonth !== state.currentPeriod.month ||
          newYear !== state.currentPeriod.year)
      ) {
        state.archivedLogs = [...state.archivedLogs, ...state.decisionLogs];
        state.decisionLogs = [];
        state.categories.forEach((category) => {
          category.currentSpent = 0;
        });
        state.currentPeriod = { month: newMonth, year: newYear };
      }

      if (!state.currentPeriod) {
        state.currentPeriod = { month: newMonth, year: newYear };
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
      state.currentPeriod = null;
    },

    addCategory: (
      state,
      action: PayloadAction<{ name: string; monthlyBudget: number }>
    ) => {
      const { name, monthlyBudget } = action.payload;
      const id = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      state.categories.push({
        id,
        name,
        monthlyBudget,
        currentSpent: 0,
      });
    },

    removeCategory: (state, action: PayloadAction<string>) => {
      const categoryId = action.payload;
      state.categories = state.categories.filter((c) => c.id !== categoryId);
      state.decisionLogs = state.decisionLogs.filter((l) => l.categoryId !== categoryId);
      if (state.lastUsedCategoryId === categoryId) {
        state.lastUsedCategoryId = null;
      }
    },

    updateTransaction: (
      state,
      action: PayloadAction<{ id: string; newAmount: number }>
    ) => {
      const { id, newAmount } = action.payload;
      const log = state.decisionLogs.find((l) => l.id === id);
      if (log) {
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
      if (log) {
        const category = state.categories.find((c) => c.id === log.categoryId);
        if (category) {
          category.currentSpent -= log.amount;
        }
      }
      state.decisionLogs = state.decisionLogs.filter((l) => l.id !== id);
    },
  },
});

export const {
  logDecision,
  setSpent,
  updateBudget,
  syncToday,
  resetAllSpent,
  resetToDefaults,
  updateTransaction,
  deleteTransaction,
  setLastUsedCategory,
  undoLastDecision,
  addCategory,
  removeCategory,
} = budgetSlice.actions;
export default budgetSlice.reducer;
