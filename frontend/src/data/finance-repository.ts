import { storage } from "@/src/utils/storage";
import { Account, Budget, OutboxEvent, Transaction, Workspace } from "@/src/domain/finance";

const keys = {
  workspaces: "vaultledger.workspaces",
  accounts: "vaultledger.accounts",
  transactions: "vaultledger.transactions",
  budgets: "vaultledger.budgets",
  outbox: "vaultledger.outbox",
};

const read = async <T>(key: string): Promise<T[]> =>
  JSON.parse((await storage.getItem(key, "[]")) as string) as T[];

const write = async <T>(key: string, value: T[]) => storage.setItem(key, JSON.stringify(value));

export const financeRepository = {
  // Workspaces
  listWorkspaces: () => read<Workspace>(keys.workspaces),
  saveWorkspace: async (item: Workspace) =>
    write(keys.workspaces, [...(await read<Workspace>(keys.workspaces)), item]),

  // Accounts (scoped by workspaceId)
  listAccounts: async (workspaceId: string) =>
    (await read<Account>(keys.accounts)).filter((item) => item.workspaceId === workspaceId),
  saveAccount: async (item: Account) =>
    write(keys.accounts, [...(await read<Account>(keys.accounts)), item]),

  // Transactions (append-only) + outbox event
  listTransactions: async (workspaceId: string) =>
    (await read<Transaction>(keys.transactions))
      .filter((item) => item.workspaceId === workspaceId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
  saveTransaction: async (item: Transaction) => {
    const all = await read<Transaction>(keys.transactions);
    await write(keys.transactions, [...all, item]);
    const event: OutboxEvent = {
      id: item.id,
      entityType: "transaction",
      entityId: item.id,
      operation: "create",
      payload: item,
      retryCount: 0,
      createdAt: item.createdAt,
    };
    await write(keys.outbox, [...(await read<OutboxEvent>(keys.outbox)), event]);
  },

  // Budgets
  listBudgets: async (workspaceId: string) =>
    (await read<Budget>(keys.budgets)).filter((item) => item.workspaceId === workspaceId),
  saveBudget: async (item: Budget) =>
    write(keys.budgets, [...(await read<Budget>(keys.budgets)), item]),
  deleteBudget: async (id: string) => {
    const all = await read<Budget>(keys.budgets);
    await write(
      keys.budgets,
      all.filter((b) => b.id !== id),
    );
  },

  // Outbox
  listOutbox: () => read<OutboxEvent>(keys.outbox),
  clearOutbox: () => write(keys.outbox, []),
};
