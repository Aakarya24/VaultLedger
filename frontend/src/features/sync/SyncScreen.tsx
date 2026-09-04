import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { C } from "@/src/shared/theme";
import { ScreenTitle } from "@/src/shared/ui/Primitives";

export function SyncScreen() {
  const { outbox, sync, syncState } = useFinance();
  const isBusy = syncState.syncing;

  return (
    <View testID="sync-screen">
      <ScreenTitle title="Sync center" subtitle="Offline changes stay safe on-device" />

      <View style={[s.card, outbox.length ? s.pending : s.good]}>
        <Ionicons
          name={outbox.length ? "cloud-offline-outline" : "cloud-done-outline"}
          size={24}
          color={outbox.length ? C.amber : C.brand}
        />
        <View style={s.flex}>
          <Text style={s.title}>
            {outbox.length
              ? `${outbox.length} change${outbox.length > 1 ? "s" : ""} pending`
              : "All changes synced"}
          </Text>
          <Text style={s.muted}>
            {outbox.length
              ? "Your ledger is fully usable offline."
              : "Server acknowledged the outbox."}
          </Text>
        </View>
      </View>

      {syncState.lastError ? (
        <View style={s.errorCard} testID="sync-error-detail">
          <Ionicons name="alert-circle-outline" size={18} color={C.red} />
          <Text style={s.errorText}>{syncState.lastError}</Text>
        </View>
      ) : null}

      <Pressable testID="sync-now" style={s.secondary} onPress={sync} disabled={isBusy}>
        {isBusy ? (
          <ActivityIndicator color={C.brand} />
        ) : (
          <Ionicons name="sync-outline" size={18} color={C.brand} />
        )}
        <Text style={s.secondaryText}>{isBusy ? "Syncing…" : "Sync now"}</Text>
      </Pressable>

      <Text style={s.section}>Conflict policy</Text>
      <Text style={s.body}>
        Metadata uses latest-version-wins. Financial amounts are never overwritten; corrections
        create adjustment entries.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 18, borderRadius: 16, flexDirection: "row", gap: 13, alignItems: "center" },
  pending: { backgroundColor: C.amberBg },
  good: { backgroundColor: C.pale },
  flex: { flex: 1 },
  title: { color: C.ink, fontWeight: "800", fontSize: 15 },
  muted: { color: C.muted, fontSize: 12, marginTop: 4 },
  errorCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FCE8E8",
    borderWidth: 1,
    borderColor: "#F5C7C7",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: { color: C.red, fontSize: 13, flex: 1, fontWeight: "700" },
  secondary: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.brand,
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: { color: C.brand, fontWeight: "800" },
  section: { color: C.ink, fontSize: 18, fontWeight: "800", marginTop: 26, marginBottom: 8 },
  body: { color: C.muted, fontSize: 14, lineHeight: 21 },
});
