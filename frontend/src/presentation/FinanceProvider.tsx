import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { financeRepository } from "@/src/data/finance-repository";
import {
  Account,
  Budget,
  OutboxEvent,
  Transaction,
  Workspace,
  makeId,
} from "@/src/domain/finance";

type Toast = { id: string; kind: "info" | "success" | "error"; text: string };
type SyncState = { pending: number; lastError?: string; syncing: boolean };

type FinanceContextValue = {
  workspaces: Workspace[];
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  outbox: OutboxEvent[];
  activeWorkspace?: Workspace;
  syncState: SyncState;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  showToast: (kind: Toast["kind"], text: string) => void;
  selectWorkspace: (id: string) => Promise<void>;
  createWorkspace: (name: string, type?: string) => Promise<void>;
  createAccount: (name: string, openingBalance?: number) => Promise<void>;
  addExpense: (amountMinor: number, note: string, accountId: string) => Promise<void>;
  createBudget: (name: string, amountMinor: number) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export const FinanceProvider = ({ children }: { children: React.ReactNode }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [outbox, setOutbox] = useState<OutboxEvent[]>([]);
  const [activeId, setActiveId] = useState("");
  const [syncState, setSyncState] = useState<SyncState>({ pending: 0, syncing: false });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete toastTimers.current[id];
    }
  }, []);

  const showToast = useCallback(
    (kind: Toast["kind"], text: string) => {
      const id = makeId();
      setToasts((prev) => [...prev, { id, kind, text }]);
      toastTimers.current[id] = setTimeout(() => dismissToast(id), 3500);
    },
    [dismissToast],
  );

  const refresh = useCallback(async () => {
    const ws = await financeRepository.listWorkspaces();
    setWorkspaces(ws);
    const id = activeId || ws[0]?.id || "";
    if (id) {
      setActiveId(id);
      setAccounts(await financeRepository.listAccounts(id));
      setTransactions(await financeRepository.listTransactions(id));
      setBudgets(await financeRepository.listBudgets(id));
    }
    const box = await financeRepository.listOutbox();
    setOutbox(box);
    setSyncState((prev) => ({ ...prev, pending: box.length }));
  }, [activeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectWorkspace = async (id: string) => {
    setActiveId(id);
    setAccounts(await financeRepository.listAccounts(id));
    setTransactions(await financeRepository.listTransactions(id));
    setBudgets(await financeRepository.listBudgets(id));
  };

  const createWorkspace = async (name: string, type = "personal") => {
    const item: Workspace = { id: makeId(), name, type, createdAt: new Date().toISOString() };
    await financeRepository.saveWorkspace(item);
    setActiveId(item.id);
    await refresh();
    showToast("success", `Workspace “${name}” created`);
  };

  const createAccount = async (name: string, openingBalance = 0) => {
    if (!activeId) return;
    await financeRepository.saveAccount({
      id: makeId(),
      workspaceId: activeId,
      name,
      type: "checking",
      currency: "INR",
      openingBalance,
      createdAt: new Date().toISOString(),
    });
    await refresh();
    showToast("success", `Account “${name}” added`);
  };

  const addExpense = async (amountMinor: number, note: string, accountId: string) => {
    if (!activeId || amountMinor <= 0 || !accountId) return;
    const now = new Date().toISOString();
    await financeRepository.saveTransaction({
      id: makeId(),
      workspaceId: activeId,
      accountId,
      type: "expense",
      amountMinor,
      currency: "INR",
      occurredAt: now,
      note,
      createdAt: now,
      updatedAt: now,
      version: 1,
      syncStatus: "pending",
    });
    await refresh();
    showToast("success", "Expense recorded to ledger");
  };

  const createBudget = async (name: string, amountMinor: number) => {
    if (!activeId || amountMinor <= 0) return;
    await financeRepository.saveBudget({
      id: makeId(),
      workspaceId: activeId,
      name,
      amountMinor,
      period: new Date().toISOString().slice(0, 7),
      createdAt: new Date().toISOString(),
    });
    await refresh();
    showToast("success", `Budget “${name}” created`);
  };

  const removeBudget = async (id: string) => {
    await financeRepository.deleteBudget(id);
    await refresh();
    showToast("info", "Budget removed");
  };

  const sync = useCallback(async () => {
    const api = process.env.EXPO_PUBLIC_BACKEND_URL;
    const pending = await financeRepository.listOutbox();
    if (!pending.length) {
      showToast("info", "Nothing to sync");
      return;
    }
    if (!api) {
      setSyncState((prev) => ({ ...prev, lastError: "Backend URL not configured" }));
      showToast("error", "Backend URL not configured");
      return;
    }
    setSyncState((prev) => ({ ...prev, syncing: true, lastError: undefined }));
    const payload = pending.map((event) => ({
      id: event.id,
      entity_type: event.entityType,
      entity_id: event.entityId,
      operation: event.operation,
      retry_count: event.retryCount,
      created_at: event.createdAt,
      payload: {
        id: event.payload.id,
        workspace_id: event.payload.workspaceId,
        account_id: event.payload.accountId,
        type: event.payload.type,
        amount_minor: event.payload.amountMinor,
        currency: event.payload.currency,
        occurred_at: event.payload.occurredAt,
        note: event.payload.note,
        created_at: event.payload.createdAt,
        updated_at: event.payload.updatedAt,
        version: event.payload.version,
        sync_status: event.payload.syncStatus,
      },
    }));
    try {
      const response = await fetch(`${api}/api/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = `Sync failed: HTTP ${response.status}`;
        setSyncState({ pending: pending.length, syncing: false, lastError: error });
        showToast("error", error);
        return;
      }
      await financeRepository.clearOutbox();
      await refresh();
      setSyncState({ pending: 0, syncing: false, lastError: undefined });
      showToast("success", `Synced ${pending.length} change${pending.length > 1 ? "s" : ""}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network unreachable";
      setSyncState({ pending: pending.length, syncing: false, lastError: message });
      showToast("error", `Offline: ${message}`);
    }
  }, [refresh, showToast]);

  const value = useMemo(
    () => ({
      workspaces,
      accounts,
      transactions,
      budgets,
      outbox,
      activeWorkspace: workspaces.find((w) => w.id === activeId),
      syncState,
      toasts,
      dismissToast,
      showToast,
      selectWorkspace,
      createWorkspace,
      createAccount,
      addExpense,
      createBudget,
      removeBudget,
      refresh,
      sync,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspaces, accounts, transactions, budgets, outbox, activeId, syncState, toasts],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
};

export const useFinance = () => {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("FinanceProvider is required");
  return value;
};
