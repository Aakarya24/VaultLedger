import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { money } from "@/src/domain/finance";
import { C } from "@/src/shared/theme";
import { EmptyLine, ScreenTitle } from "@/src/shared/ui/Primitives";

export function LedgerScreen() {
  const { transactions } = useFinance();
  return (
    <View testID="ledger-screen">
      <ScreenTitle title="Account ledger" subtitle="Append-only activity for this workspace" />
      {transactions.map((t) => (
        <View key={t.id} style={s.row} testID={`ledger-row-${t.id}`}>
          <View style={s.icon}>
            <Ionicons name="arrow-up-outline" size={17} color={C.red} />
          </View>
          <View style={s.flex}>
            <Text style={s.name}>{t.note}</Text>
            <Text style={s.muted}>
              {new Date(t.occurredAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}{" "}
              · v{t.version} · {t.syncStatus}
            </Text>
          </View>
          <Text style={s.expense}>−{money(t.amountMinor)}</Text>
        </View>
      ))}
      {!transactions.length && (
        <EmptyLine text="No transactions match this workspace." testID="ledger-empty" />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5E8E6",
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  name: { color: C.ink, fontWeight: "700", fontSize: 15 },
  muted: { color: C.muted, fontSize: 12, marginTop: 4 },
  expense: { color: C.red, fontWeight: "800" },
});
