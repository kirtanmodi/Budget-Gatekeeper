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
      }
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
  },
});

export const { logDecision, setSpent, updateBudget, startNewMonth, syncToday, resetAllSpent, resetToDefaults } =
  budgetSlice.actions;
export default budgetSlice.reducer;
