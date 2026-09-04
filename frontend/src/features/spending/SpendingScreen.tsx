import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { currentPeriod, money } from "@/src/domain/finance";
import { C } from "@/src/shared/theme";
import { EmptyLine, ScreenTitle } from "@/src/shared/ui/Primitives";

export function SpendingScreen() {
  const { transactions } = useFinance();
  const period = currentPeriod();
  const monthTx = useMemo(
    () => transactions.filter((t) => t.occurredAt.slice(0, 7) === period && t.type === "expense"),
    [transactions, period],
  );
  const monthTotal = monthTx.reduce((sum, t) => sum + t.amountMinor, 0);
  const largest = monthTx.reduce((max, t) => (t.amountMinor > max ? t.amountMinor : max), 0);
  const progress = largest ? Math.min(1, monthTotal / (largest * 4)) : 0;

  return (
    <View testID="spending-screen">
      <ScreenTitle
        title="Monthly spending"
        subtitle={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
      />
      <View style={s.metric}>
        <Text style={s.label}>THIS MONTH</Text>
        <Text style={s.value} testID="spending-total">
          {money(monthTotal)}
        </Text>
        <View style={s.progress}>
          <View style={[s.fill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
        <Text style={s.muted}>Tracked from local ledger entries</Text>
      </View>
      <Text style={s.section}>Breakdown</Text>
      {monthTx.length ? (
        monthTx.slice(0, 6).map((t) => (
          <View key={t.id} style={s.row}>
            <Text style={s.rowName}>{t.note}</Text>
            <Text style={s.rowAmount}>{money(t.amountMinor)}</Text>
          </View>
        ))
      ) : (
        <EmptyLine text="No spending records for this month." testID="spending-empty" />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  metric: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.line,
  },
  label: { color: C.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  value: { color: C.ink, fontSize: 28, fontWeight: "800", marginVertical: 14 },
  progress: { height: 8, backgroundColor: C.pale, borderRadius: 8, overflow: "hidden" },
  fill: { height: 8, backgroundColor: C.brand, borderRadius: 8 },
  muted: { color: C.muted, fontSize: 12, marginTop: 12 },
  section: { color: C.ink, fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 12 },
  row: {
    minHeight: 48,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  rowName: { color: C.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  rowAmount: { color: C.red, fontSize: 14, fontWeight: "800" },
});
