import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { C } from "@/src/shared/theme";

const iconFor = (kind: "info" | "success" | "error") =>
  kind === "success"
    ? "checkmark-circle"
    : kind === "error"
      ? "alert-circle"
      : "information-circle";

const bgFor = (kind: "info" | "success" | "error") =>
  kind === "success" ? C.pale : kind === "error" ? "#FCE8E8" : C.card;

const colorFor = (kind: "info" | "success" | "error") =>
  kind === "success" ? C.brand : kind === "error" ? C.red : C.ink;

export function ToastRail() {
  const { toasts, dismissToast } = useFinance();
  if (!toasts.length) return null;
  return (
    <View style={[s.wrap, styleBoxNone]} testID="toast-rail">
      {toasts.map((t) => (
        <Pressable
          key={t.id}
          testID={`toast-${t.kind}`}
          onPress={() => dismissToast(t.id)}
          style={[s.toast, { backgroundColor: bgFor(t.kind) }]}
        >
          <Ionicons name={iconFor(t.kind)} size={20} color={colorFor(t.kind)} />
          <Text numberOfLines={2} style={[s.text, { color: colorFor(t.kind) }]}>
            {t.text}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styleBoxNone = { pointerEvents: "box-none" as const };

const s = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    gap: 8,
    zIndex: 100,
    elevation: 20,
  },
  toast: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.line,
    // @ts-expect-error boxShadow supported on RN 0.76+ / web
    boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
  },
  text: { flex: 1, fontWeight: "700", fontSize: 13 },
});
