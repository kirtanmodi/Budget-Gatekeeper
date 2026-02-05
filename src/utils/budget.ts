import type { Category } from '../types';

export const getTotalBudget = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + c.monthlyBudget, 0);

export const getTotalSpent = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + c.currentSpent, 0);
