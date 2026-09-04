// Pure domain models — no Flutter/React/HTTP imports.
// Money is stored as integer minor units (paise for INR) to avoid float rounding.

export type Workspace = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
};

export type Account = {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  currency: "INR";
  openingBalance: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  workspaceId: string;
  accountId: string;
  type: "expense" | "income" | "adjustment";
  amountMinor: number;
  currency: "INR";
  occurredAt: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  syncStatus: "pending" | "synced";
};

export type Budget = {
  id: string;
  workspaceId: string;
  name: string;
  amountMinor: number;
  period: string; // YYYY-MM
  createdAt: string;
};

export type OutboxEvent = {
  id: string;
  entityType: "transaction";
  entityId: string;
  operation: "create" | "adjust";
  payload: Transaction;
  retryCount: number;
  createdAt: string;
};

export const money = (minor: number) =>
  `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const currentPeriod = () => new Date().toISOString().slice(0, 7);
