import type { Category } from '../types';
import { getEffectiveBudget } from '../store/budgetSlice';

export const getTotalBudget = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + getEffectiveBudget(c), 0);

export const getTotalSpent = (categories: Category[]): number =>
  categories.reduce((sum, c) => sum + c.currentSpent, 0);
