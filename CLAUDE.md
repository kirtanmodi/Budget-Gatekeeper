# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server with HMR
npm run build    # TypeScript check + Vite bundle
npm run lint     # ESLint all files
npm run test     # Vitest watch mode
npm run test:run # Vitest single run
npm run preview  # Local production preview
npm run deploy   # Build + Netlify deploy --prod
```

## Mobile-First Design

This is a **mobile-first PWA**. All UI must be designed for phones first:
- Touch targets: minimum 44×44px
- Bottom navigation bar (NavBar) — keep content above `pb-20`
- Single-column layouts, full-width cards
- Large, readable text (base 16px)
- Swipe gestures supported (e.g., CheckPage swipe for Bought/Skip)
- Haptic feedback on key actions
- No hover-dependent interactions

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
  settings            → User preferences (graceThreshold)
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
- `updateGraceThreshold` — configure FREE zone threshold

### Decision Engine

Core logic in `src/engine/decision.ts`:

```
calculateDecision(budget, spent, newAmount, currentDay, daysInMonth, graceThreshold)
  → { type: 'YES' } | { type: 'WAIT', days: N } | { type: 'NO' }

Zones (graceThreshold defaults to 0.6 / 60%, configurable in Settings):
  FREE (≤60%)       → Auto-approve (grace zone)
  CONTROL (60-100%) → Pace-check against daily allowance
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

Uses Vitest + React Testing Library:
- `npm run test` — watch mode
- `npm run test:run` — single run
- Tests in `src/engine/decision.test.ts` cover decision logic
