import type { Category } from '../types';

export const defaultCategories: Category[] = [
  { id: 'groceries', name: 'Groceries', monthlyBudget: 11000, currentSpent: 0 },
  { id: 'transport', name: 'Transport', monthlyBudget: 5000, currentSpent: 0 },
  { id: 'eating-entertainment', name: 'Eating Out & Entertainment', monthlyBudget: 11000, currentSpent: 0 },
  { id: 'life-events', name: 'Life Events', monthlyBudget: 5000, currentSpent: 0 },
  { id: 'wife-personal', name: 'Wife Personal', monthlyBudget: 14000, currentSpent: 0 },
  { id: 'my-personal', name: 'My Personal', monthlyBudget: 14000, currentSpent: 0 },
];
