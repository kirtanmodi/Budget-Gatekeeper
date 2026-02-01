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

## MAKE Sure any page you create is Mobile first

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          App (Router)                               │
├─────────────────────────────────────────────────────────────────────┤
│  /           CheckPage      → Primary expense check UI              │
│  /dashboard  DashboardPage  → Budget overview                       │
│  /transactions              → Transaction history                   │
│  /adjust     AdjustSpendPage→ Manual spend corrections              │
│  /insights   InsightsPage   → Spending analysis + suggestions       │
│  /overview   MonthlyOverview→ Month-end summary                     │
│  /settings   SettingsPage   → Category/budget management            │
│  /debug      DebugPage      → Dev tools (data export/import)        │
├─────────────────────────────────────────────────────────────────────┤
│                         Redux Store                                  │
│                  (budgetSlice + redux-persist)                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Stack**: React 19 + TypeScript (strict) + Redux Toolkit + Vite + Tailwind CSS 4

### State Management

Single Redux slice (`src/store/budgetSlice.ts`) with persistence to localStorage:

```
BudgetState {
  categories[]        → Budget + spent + temporaryAdjustment per category
  currentSnapshot     → Month metadata for rollover
  decisionLogs[]      → Current month transactions
  archivedLogs[]      → Historical logs
  system.today        → Current date (ISO string)
  lastUsedCategoryId  → Form pre-fill
}

Category {
  id, name, monthlyBudget, currentSpent
  temporaryAdjustment?  → This-month-only budget delta
}
```

Key helper: `getEffectiveBudget(category)` → `monthlyBudget + (temporaryAdjustment ?? 0)`

Key actions:
- `logDecision` / `undoLastDecision` — record/revert transactions
- `updateBudget` / `updateBudgetWithScope` — permanent vs temporary budget changes
- `updateTransaction` / `deleteTransaction` — edit transaction history
- `addCategory` / `removeCategory` — category CRUD
- `syncToday` — triggers month rollover if needed
- `resetAllSpent` / `resetToDefaults` — data management

### Decision Engine

Core logic in `src/engine/decision.ts`:

```
calculateDecision(budget, spent, newAmount, currentDay, daysInMonth)
  → { type: 'YES' } | { type: 'WAIT', days: N } | { type: 'NO' }

Zones:
  FREE (≤80%)       → Auto-approve
  CONTROL (80-100%) → Pace-check against daily allowance
  STOP (>100%)      → Reject
```

### Suggestions Engine

`src/engine/suggestions.ts` analyzes spending patterns:
- Overspending detection (PACE_WARNING, BUDGET_INCREASE)
- Underspending detection (SURPLUS, BUDGET_DECREASE)
- Cross-category reallocation opportunities

### Data Flow

```
User Input (ExpenseForm)
       │
       ▼
calculateDecision() ──▶ DecisionResult display
       │
       ▼ (if "Bought" / "Skipped")
logDecision() ──▶ Redux state ──▶ localStorage persist
       │
       ▼
InsightsPage ◀── generateSuggestions() analyzes patterns
```

## Key Patterns

- **Effective budget**: Always use `getEffectiveBudget(category)` instead of raw `monthlyBudget`
- **Temporary adjustments**: One-time monthly budget changes (reset on month rollover)
- **Month rollover**: `syncToday()` triggered on app init + visibility change
- **Undo**: Single-level only (`undoLastDecision` reverts one transaction)
- **Category IDs**: Timestamp-based to avoid collisions
- **Locale**: Hard-coded `en-IN` (Indian Rupee formatting)
- **Form state**: Local useState in pages, not Redux

## File Structure

```
src/
├── engine/
│   ├── decision.ts      → Core YES/WAIT/NO logic
│   └── suggestions.ts   → Spending analysis
├── store/
│   ├── budgetSlice.ts   → Redux state + actions
│   ├── hooks.ts         → Typed useAppSelector/Dispatch
│   └── index.ts         → Store config + persistence
├── components/          → Reusable UI components
├── pages/               → Route components
├── types/index.ts       → All TypeScript interfaces
├── utils/
│   ├── budget.ts        → Budget calculation helpers
│   ├── format.ts        → Currency/date formatting
│   └── haptics.ts       → Vibration feedback
├── constants/zones.ts   → FREE/CONTROL/STOP thresholds
└── data/defaultCategories.ts
```

## Testing

No test infrastructure configured. Add Vitest + React Testing Library if needed.
