import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { money } from "@/src/domain/finance";
import { C } from "@/src/shared/theme";
import { EmptyLine, SectionHeader } from "@/src/shared/ui/Primitives";

type Props = {
  onOpenAccount: () => void;
  onOpenLedger: () => void;
};

// Home hero — net position + accounts strip + recent activity.
export function HomeScreen({ onOpenAccount, onOpenLedger }: Props) {
  const { accounts, transactions } = useFinance();
  const total = transactions.reduce(
    (sum, t) => sum + (t.type === "expense" ? -t.amountMinor : t.amountMinor),
    0,
  );
  return (
    <View>
      <View style={s.balance} testID="net-position">
        <View style={s.cardTop}>
          <Text style={s.cardLabel}>NET POSITION</Text>
          <Ionicons name="shield-checkmark-outline" size={20} color="#D3E0D8" />
        </View>
        <Text style={s.balanceText}>{money(total)}</Text>
        <Text style={s.cardFoot}>
          Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"} · INR
        </Text>
      </View>

      <SectionHeader
        title="Accounts"
        action="Add account"
        onPress={onOpenAccount}
        testID="add-account-btn"
      />
      {accounts.length === 0 ? (
        <EmptyLine text="Add an account to begin tracking." testID="empty-accounts" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {accounts.map((a) => {
            const balance =
              a.openingBalance +
              transactions
                .filter((t) => t.accountId === a.id)
                .reduce((sum, t) => sum + (t.type === "expense" ? -t.amountMinor : t.amountMinor), 0);
            return (
              <View style={s.account} key={a.id} testID={`account-${a.id}`}>
                <View style={s.accountIcon}>
                  <Ionicons name="wallet-outline" size={20} color={C.brand} />
                </View>
                <Text style={s.accountName}>{a.name}</Text>
                <Text style={s.accountAmount}>{money(balance)}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      <SectionHeader
        title="Recent activity"
        action="View ledger"
        onPress={onOpenLedger}
        testID="open-ledger"
      />
      {transactions.slice(0, 3).map((t) => (
        <View key={t.id} style={s.transaction} testID={`tx-${t.id}`}>
          <View style={s.transactionIcon}>
            <Ionicons name="arrow-up-outline" size={17} color={C.red} />
          </View>
          <View style={s.flex}>
            <Text style={s.transactionName}>{t.note}</Text>
            <Text style={s.muted}>Today · Expense</Text>
          </View>
          <Text style={s.expense}>−{money(t.amountMinor)}</Text>
        </View>
      ))}
      {!transactions.length && <EmptyLine text="Your immutable ledger will appear here." />}

      <Pressable
        testID="add-expense-inline"
        style={s.inlineFab}
        onPress={() => {
          // Fallback CTA for accessibility — the floating one is the primary path.
          onOpenLedger();
        }}
      >
        <Ionicons name="list-outline" size={18} color={C.brand} />
        <Text style={s.inlineFabText}>View full ledger</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  balance: { marginTop: 8, padding: 22, borderRadius: 20, backgroundColor: C.brand },
  cardTop: { flexDirection: "row", justifyContent: "space-between" },
  cardLabel: { color: "#C6D6CE", fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  balanceText: { color: "#FFF", fontSize: 34, fontWeight: "800", marginTop: 16 },
  cardFoot: { color: "#C6D6CE", marginTop: 8, fontSize: 13 },
  row: { gap: 12 },
  account: {
    width: 156,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: C.line,
  },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  accountName: { color: C.muted, fontSize: 13 },
  accountAmount: { color: C.ink, fontSize: 17, fontWeight: "800", marginTop: 5 },
  transaction: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E8E6",
    alignItems: "center",
    justifyContent: "center",
  },
  transactionName: { color: C.ink, fontWeight: "700", fontSize: 15 },
  flex: { flex: 1 },
  muted: { color: C.muted, fontSize: 12, marginTop: 4 },
  expense: { color: C.red, fontWeight: "800" },
  inlineFab: {
    alignSelf: "flex-start",
    marginTop: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.brand,
    paddingHorizontal: 16,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineFabText: { color: C.brand, fontWeight: "800", fontSize: 13 },
});
