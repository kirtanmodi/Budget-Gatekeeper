# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # TypeScript check + Vite bundle
npm run lint     # ESLint all files
npm run preview  # Local production preview
npm run deploy   # Build + Netlify deploy --prod
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App (Router)                         │
├─────────────────────────────────────────────────────────────┤
│  CheckPage    Dashboard    Transactions    Adjust   Settings│
│     │             │             │            │          │   │
│     └─────────────┴─────────────┴────────────┴──────────┘   │
│                            │                                 │
│                     Redux Store                              │
│              (budgetSlice + redux-persist)                   │
└─────────────────────────────────────────────────────────────┘
```

**Stack**: React 19 + TypeScript (strict) + Redux Toolkit + Vite + Tailwind CSS 4

### State Management

Single Redux slice (`src/store/budgetSlice.ts`) with persistence to localStorage:

```
BudgetState {
  categories[]        → Budget + spent per category
  currentSnapshot     → Month metadata for rollover
  decisionLogs[]      → Current month transactions
  archivedLogs[]      → Historical logs
  lastUsedCategoryId  → Form pre-fill
}
```

Key actions: `logDecision`, `undoLastDecision`, `updateBudget`, `addCategory`, `removeCategory`, `syncToday`

### Decision Engine

Core logic in `src/engine/decision.ts`:

```
calculateDecision(budget, spent, newAmount, currentDay, daysInMonth)
  → { type: 'YES' } | { type: 'WAIT', days: N } | { type: 'NO' }

Zones:
  FREE (≤80%)    → Auto-approve
  CONTROL (80-100%) → Pace-check against daily allowance
  STOP (>100%)   → Reject
```

### Data Flow

```
User Input (ExpenseForm)
       │
       ▼
calculateDecision() ──▶ DecisionResult display
       │
       ▼ (if "Bought")
logDecision() ──▶ Redux state ──▶ localStorage persist
```

## Key Patterns

- **Month rollover**: `syncToday()` action triggered on app init + visibility change
- **Undo**: Single-level only (`undoLastDecision` reverts one transaction)
- **Category IDs**: Timestamp-based to avoid collisions
- **Locale**: Hard-coded `en-IN` (Indian Rupee formatting)
- **Form state**: Local useState in pages, not Redux

## Testing

No test infrastructure configured. Add Vitest + React Testing Library if needed.