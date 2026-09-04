import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { C } from "@/src/shared/theme";

// Persistent banner shown when the last sync attempt failed.
// Complements the transient toast so the failure state doesn't disappear.
export function SyncErrorBanner() {
  const { syncState, sync } = useFinance();
  if (!syncState.lastError) return null;
  return (
    <View style={s.banner} testID="sync-error-banner">
      <Ionicons name="cloud-offline-outline" size={20} color={C.amber} />
      <View style={s.text}>
        <Text style={s.title}>Sync couldn&apos;t complete</Text>
        <Text style={s.body} numberOfLines={2}>
          {syncState.lastError}
        </Text>
      </View>
      <Pressable style={s.retry} onPress={sync} testID="sync-retry">
        <Text style={s.retryText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    marginTop: 12,
    marginHorizontal: 24,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: C.amberBg,
    borderWidth: 1,
    borderColor: "#E9D69A",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: { flex: 1 },
  title: { color: C.ink, fontWeight: "800", fontSize: 13 },
  body: { color: C.amber, fontSize: 12, marginTop: 2 },
  retry: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
});
