import React, { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { currentPeriod, money } from "@/src/domain/finance";
import { C } from "@/src/shared/theme";
import { EmptyLine, ScreenTitle, SectionHeader } from "@/src/shared/ui/Primitives";

type Props = { onCreate: () => void };

export function BudgetsScreen({ onCreate }: Props) {
  const { budgets, transactions, removeBudget } = useFinance();
  const period = currentPeriod();
  const monthSpend = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense" && t.occurredAt.slice(0, 7) === period)
        .reduce((sum, t) => sum + t.amountMinor, 0),
    [transactions, period],
  );

  return (
    <View testID="budgets-screen">
      <ScreenTitle
        title="Budgets"
        subtitle="Set monthly ceilings and watch spending against them"
      />
      <SectionHeader
        title={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        action="New budget"
        onPress={onCreate}
        testID="create-budget"
      />

      {budgets.length === 0 ? (
        <EmptyLine text="No budgets yet. Create one for the current month." testID="budgets-empty" />
      ) : (
        budgets.map((b) => {
          // Simple: apply the workspace's month spend against every budget for now.
          // A future iteration adds category-scoped budgets.
          const pct = Math.min(1, monthSpend / Math.max(1, b.amountMinor));
          const overBudget = monthSpend > b.amountMinor;
          return (
            <View key={b.id} style={s.card} testID={`budget-${b.id}`}>
              <View style={s.cardHead}>
                <Text style={s.name}>{b.name}</Text>
                <Pressable
                  onPress={() => removeBudget(b.id)}
                  hitSlop={12}
                  testID={`remove-budget-${b.id}`}
                >
                  <Ionicons name="trash-outline" size={16} color={C.muted} />
                </Pressable>
              </View>
              <Text style={[s.progressText, overBudget && s.over]}>
                {money(monthSpend)} of {money(b.amountMinor)}
              </Text>
              <View style={s.progress}>
                <View
                  style={[
                    s.fill,
                    {
                      width: `${Math.round(pct * 100)}%`,
                      backgroundColor: overBudget ? C.red : C.brand,
                    },
                  ]}
                />
              </View>
              <Text style={s.foot}>
                {overBudget
                  ? `Over budget by ${money(monthSpend - b.amountMinor)}`
                  : `${money(b.amountMinor - monthSpend)} left this month`}
              </Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: C.ink, fontSize: 16, fontWeight: "800" },
  progressText: { color: C.ink, fontSize: 13, marginTop: 8, fontWeight: "700" },
  over: { color: C.red },
  progress: {
    marginTop: 10,
    height: 8,
    backgroundColor: C.pale,
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: 8 },
  foot: { color: C.muted, fontSize: 12, marginTop: 10 },
});
