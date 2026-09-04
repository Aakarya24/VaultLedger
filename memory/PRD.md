# VaultLedger Core — Product Requirements

## Vision
Production-style, offline-first personal & team finance tracker. Multiple workspaces
(Personal / Family / Business), multiple accounts, immutable (append-only) ledger,
budgets, biometric app lock, and outbox-based sync with a documented conflict policy.

## Stack
- **Frontend**: Expo (React Native) + Expo Router + TypeScript
- **State / DI**: React Context + `useMemo` (pragmatic Zustand-free port of the
  original Clean Architecture domain/data/presentation split)
- **Local Persistence**: AsyncStorage via `@/src/utils/storage` (cross-platform, JSON blobs)
- **Backend**: FastAPI + Motor (async MongoDB) — sync + persistence
- **Auth**: Local-only profile + device biometrics on native (bypassed on web preview)

## Architecture
```
lib-equivalent:
  src/
    domain/finance.ts               # pure types + money() helper (paise ints)
    data/finance-repository.ts      # AsyncStorage-backed repo (contract from domain)
    presentation/
      FinanceProvider.tsx           # single source of truth for state + sync
      BiometricGate.tsx             # cold-launch biometric prompt
    features/
      home/HomeScreen.tsx
      ledger/LedgerScreen.tsx
      budgets/BudgetsScreen.tsx
      spending/SpendingScreen.tsx
      sync/SyncScreen.tsx
      workspaces/WorkspaceSwitcher.tsx
      sheets/CreationSheet.tsx      # unified create modal
    shared/
      theme.ts
      ui/Primitives.tsx (buttons/section headers/empty state)
      ui/Toast.tsx                  # transient success/error notifications
      ui/SyncErrorBanner.tsx        # persistent failure banner + retry
      ui/BottomSheetForm.tsx        # web/native branched sheet
  app/
    _layout.tsx                     # icon font pre-warm + stack
    index.tsx                       # tab shell + FAB
```

## Core data model
- **Money is stored as integer minor units (paise)** — `₹125.50 -> 12550` — to avoid
  floating point rounding. `money()` helper formats for display.
- **Transactions are append-only.** Corrections create adjustment entries rather than
  editing amounts.

## Features shipped
1. **Workspace management** — create + switch between Personal/Family/Business etc.
2. **Accounts** — per-workspace, tracked as horizontal chip strip on Home.
3. **Add Expense** — floating FAB opens a bottom sheet with amount / account chip picker / note.
   Amount is validated (`>0`) and stored as paise.
4. **Ledger tab** — append-only view with version and syncStatus displayed per row.
5. **Budgets tab** — create monthly ceilings; card shows progress against month spend
   (overshoots go red).
6. **Spending tab** — current-month total with breakdown of latest expenses.
7. **Sync tab** — pending outbox count + "Sync now" button that POSTs to `/api/sync`.
8. **Sync failure UX** — toast + persistent banner + retry, so failures don't dead-end.
9. **Biometric app lock** — `expo-local-authentication` prompts on cold launch on native.
10. **Web preview compatibility** — bottom sheets and switcher use fixed-position overlays
    on `Platform.OS === "web"` so they don't fall below the viewport (RN Modal on web
    sizes to document, not window).

## Backend API
- `GET  /api/`                                    — health + policy note
- `POST /api/workspaces`, `GET /api/workspaces`
- `POST /api/accounts`, `GET /api/accounts/{workspace_id}`
- `POST /api/transactions`                        — version-aware idempotent upsert
- `POST /api/sync`                                — batches outbox events; **422 on invalid payload**

## Conflict policy
- Metadata: **latest-version-wins** (server compares `version`, keeps higher).
- Financial amounts are **never overwritten**; corrections must create an adjustment
  transaction (append-only guarantee).

## Testing
- Backend: `pytest` — 7/7 green (root, workspaces, accounts + 404, sync round-trip,
  empty batch, invalid payload → 422).
- Frontend: manual & automated e2e via testing_agent — all sheets on-viewport at
  390×844, FAB clickable, tabs functional.

## What's local vs cloud
- All app data lives on-device first (AsyncStorage). The backend is a *sync target*;
  the app remains fully usable offline.

## Known caveats
- Web preview auto-bypasses the biometric gate (no `local_authentication` on web).
- Budgets are workspace-level for now; per-category budgets are a future iteration.
- Sync is manual (button-triggered); background sync is a future iteration.
