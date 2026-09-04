import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "@/src/shared/theme";

export function PrimaryButton({
  text,
  onPress,
  testID,
  icon = "arrow-forward",
  disabled,
}: {
  text: string;
  onPress: () => void;
  testID?: string;
  icon?: keyof typeof Ionicons.glyphMap | null;
  disabled?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={onPress}
      style={[s.btn, disabled && s.disabled]}
    >
      <Text style={s.text}>{text}</Text>
      {icon ? <Ionicons name={icon} size={18} color="#FFF" /> : null}
    </Pressable>
  );
}

export function SectionHeader({
  title,
  action,
  onPress,
  testID,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <View style={s.header}>
      <Text style={s.title}>{title}</Text>
      {action ? (
        <Pressable onPress={onPress} testID={testID}>
          <Text style={s.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.screen}>
      <Text style={s.hero}>{title}</Text>
      <Text style={s.body}>{subtitle}</Text>
    </View>
  );
}

export function EmptyLine({ text, testID }: { text: string; testID?: string }) {
  return (
    <View style={s.empty} testID={testID}>
      <Ionicons name="document-text-outline" size={18} color={C.muted} />
      <Text style={s.muted}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  btn: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: C.brand,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  disabled: { opacity: 0.5 },
  text: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 13,
  },
  title: { color: C.ink, fontSize: 18, fontWeight: "800" },
  action: { color: C.brand, fontSize: 13, fontWeight: "700" },
  screen: { marginTop: 25, marginBottom: 18 },
  hero: { color: C.ink, fontSize: 25, fontWeight: "800" },
  body: { color: C.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  empty: {
    minHeight: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
  },
  muted: { color: C.muted, fontSize: 13 },
});
