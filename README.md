# Budget Gatekeeper

A friction-based budgeting app that makes you think before spending. Instead of just tracking expenses, it asks "Can I buy this?" and gives you a clear YES / WAIT / NO answer based on your spending pace.

## How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Amount +  │────▶│  Decision Engine │────▶│  YES / WAIT │
│   Category  │     │  (pace check)    │     │     / NO    │
└─────────────┘     └──────────────────┘     └─────────────┘
                            │
                            ▼
                    Budget Zones:
                    ≤80%  → FREE (auto-approve)
                    80-100% → CONTROL (pace check)
                    >100% → STOP (reject)
```

**The idea**: If you're pacing well, spend freely. If you're overspending, the app tells you to wait N days before buying.

## Features

- **Expense Check** — Quick YES/WAIT/NO decisions with context
- **Dashboard** — Visual budget status per category
- **Insights** — Smart suggestions (reallocate, increase/decrease budgets)
- **Transactions** — Edit/delete spending history
- **Temporary Budgets** — Adjust this month only without changing base budget

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Tech Stack

- React 19 + TypeScript
- Redux Toolkit + redux-persist (localStorage)
- Tailwind CSS 4
- Vite

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build + deploy to Netlify |

## Project Structure

```
src/
├── engine/          # Decision + suggestion logic
├── store/           # Redux slice + persistence
├── components/      # Reusable UI
├── pages/           # Route pages
├── types/           # TypeScript interfaces
└── utils/           # Formatting, haptics, helpers
```

See [CLAUDE.md](./CLAUDE.md) for detailed architecture docs.
