import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FinanceProvider, useFinance } from "@/src/presentation/FinanceProvider";
import { BiometricGate } from "@/src/presentation/BiometricGate";
import { C } from "@/src/shared/theme";
import { PrimaryButton } from "@/src/shared/ui/Primitives";
import { ToastRail } from "@/src/shared/ui/Toast";
import { SyncErrorBanner } from "@/src/shared/ui/SyncErrorBanner";
import { WorkspaceSwitcher } from "@/src/features/workspaces/WorkspaceSwitcher";
import { CreationSheet } from "@/src/features/sheets/CreationSheet";
import { HomeScreen } from "@/src/features/home/HomeScreen";
import { LedgerScreen } from "@/src/features/ledger/LedgerScreen";
import { SpendingScreen } from "@/src/features/spending/SpendingScreen";
import { SyncScreen } from "@/src/features/sync/SyncScreen";
import { BudgetsScreen } from "@/src/features/budgets/BudgetsScreen";

type Tab = "home" | "ledger" | "budgets" | "spending" | "sync";
type Sheet = null | "workspace" | "account" | "expense" | "budget";

const TAB_HEIGHT = 78;

function Shell() {
  const f = useFinance();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<Sheet>(null);

  const showFab = f.activeWorkspace && tab === "home" && f.accounts.length > 0;

  return (
    <View style={s.root} testID="vaultledger-shell">
      {/* Header (sticky) */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={s.eyebrow}>VAULTLEDGER CORE</Text>
          <Text style={s.title}>{f.activeWorkspace?.name || "Your money, clearly"}</Text>
        </View>
        <View style={s.avatar}>
          <Ionicons name="person-outline" size={18} color={C.brand} />
        </View>
      </View>

      <SyncErrorBanner />

      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingBottom: TAB_HEIGHT + insets.bottom + (showFab ? 96 : 24) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!f.activeWorkspace ? (
          <View style={s.empty}>
            <View style={s.iconCircle}>
              <Ionicons name="layers-outline" size={30} color={C.brand} />
            </View>
            <Text style={s.hero}>Start with a workspace</Text>
            <Text style={s.body}>
              Keep Personal, Family, and Business finances isolated and easy to audit.
            </Text>
            <View style={s.cta}>
              <PrimaryButton
                testID="create-workspace"
                text="Create workspace"
                onPress={() => setSheet("workspace")}
              />
            </View>
          </View>
        ) : (
          <>
            <WorkspaceSwitcher onCreate={() => setSheet("workspace")} />
            <View style={s.tabBody}>
              {tab === "home" && (
                <HomeScreen
                  onOpenAccount={() => setSheet("account")}
                  onOpenLedger={() => setTab("ledger")}
                />
              )}
              {tab === "ledger" && <LedgerScreen />}
              {tab === "budgets" && <BudgetsScreen onCreate={() => setSheet("budget")} />}
              {tab === "spending" && <SpendingScreen />}
              {tab === "sync" && <SyncScreen />}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Add Expense button — sits outside the ScrollView so it can't be clipped.
          Positioned above tab bar + safe area inset. */}
      {showFab ? (
        <Pressable
          testID="add-expense"
          style={[s.fab, { bottom: TAB_HEIGHT + insets.bottom + 16 }]}
          onPress={() => setSheet("expense")}
        >
          <Ionicons name="add" size={21} color="#FFF" />
          <Text style={s.fabText}>Add expense</Text>
        </Pressable>
      ) : null}

      {/* Bottom tab bar */}
      {f.activeWorkspace ? (
        <View
          style={[
            s.tabs,
            {
              height: TAB_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {(
            [
              ["home", "Home", "home-outline"],
              ["ledger", "Ledger", "list-outline"],
              ["budgets", "Budgets", "pricetags-outline"],
              ["spending", "Spending", "pie-chart-outline"],
              ["sync", "Sync", "cloud-outline"],
            ] as const
          ).map(([key, label, icon]) => (
            <Pressable
              key={key}
              testID={`tab-${key}`}
              style={s.tab}
              onPress={() => setTab(key)}
            >
              <Ionicons name={icon} size={21} color={tab === key ? C.brand : C.muted} />
              <Text style={[s.tabText, tab === key && s.tabActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <CreationSheet mode={sheet} onClose={() => setSheet(null)} />
      <ToastRail />
    </View>
  );
}

export default function Index() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.safe} edges={["left", "right"]}>
        <FinanceProvider>
          <BiometricGate>
            <Shell />
          </BiometricGate>
        </FinanceProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: { color: C.brand, fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: C.ink, fontSize: 24, fontWeight: "800", marginTop: 5 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 24, paddingTop: 4 },
  tabBody: { marginTop: 18 },
  empty: { alignItems: "center", paddingTop: 90 },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  hero: { color: C.ink, fontSize: 25, fontWeight: "800" },
  body: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  cta: { alignSelf: "stretch", marginTop: 24 },
  fab: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 20,
    elevation: 20,
    borderRadius: 999,
    backgroundColor: C.brand,
    paddingHorizontal: 22,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    // @ts-expect-error boxShadow supported on RN 0.76+ / web
    boxShadow: "0px 6px 14px rgba(0,0,0,0.18)",
  },
  fabText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  tabs: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
  },
  tab: { alignItems: "center", minWidth: 56, minHeight: 54 },
  tabText: { color: C.muted, fontSize: 11, marginTop: 4 },
  tabActive: { color: C.brand, fontWeight: "800" },
});
