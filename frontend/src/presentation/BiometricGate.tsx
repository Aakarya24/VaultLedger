import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C } from "@/src/shared/theme";

type Phase = "checking" | "prompt" | "prompting" | "denied" | "unlocked" | "unsupported";

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | undefined>(undefined);

  // On web (preview) local_authentication is not available — bypass the gate so
  // the app is still usable while developing.
  const gateSupported = Platform.OS !== "web";

  const authenticate = useCallback(async () => {
    if (!gateSupported) {
      setPhase("unlocked");
      return;
    }
    setPhase("prompting");
    setError(undefined);
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) {
        // Device without enrolled biometrics — surface as unsupported and let
        // the user continue. This mirrors the "graceful degradation" rule.
        setPhase("unsupported");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock VaultLedger",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        fallbackLabel: "Use passcode",
      });
      if (result.success) {
        setPhase("unlocked");
      } else {
        setPhase("denied");
        setError(result.error ? String(result.error) : "Authentication cancelled");
      }
    } catch (e) {
      setPhase("denied");
      setError(e instanceof Error ? e.message : "Biometric error");
    }
  }, [gateSupported]);

  useEffect(() => {
    // Prompt automatically on cold launch. If the platform doesn't support
    // biometrics we resolve into `unsupported` and offer manual "Continue".
    authenticate();
  }, [authenticate]);

  if (phase === "unlocked") {
    return <>{children}</>;
  }

  const isChecking = phase === "checking" || phase === "prompting";

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]} testID="biometric-gate">
      <View style={s.hero}>
        <View style={s.badge}>
          <Ionicons name="finger-print" size={38} color={C.brand} />
        </View>
        <Text style={s.title}>VaultLedger is locked</Text>
        <Text style={s.body}>
          Your ledger is protected by biometrics. Authenticate to open your workspaces.
        </Text>
      </View>

      <View style={s.actions}>
        {isChecking ? (
          <View style={s.busy}>
            <ActivityIndicator color={C.brand} />
            <Text style={s.busyText}>Waiting for biometrics…</Text>
          </View>
        ) : (
          <>
            {error ? (
              <Text style={s.error} testID="biometric-error">
                {error}
              </Text>
            ) : null}
            <Pressable style={s.primary} onPress={authenticate} testID="biometric-unlock">
              <Ionicons name="finger-print" size={20} color="#FFF" />
              <Text style={s.primaryText}>
                {phase === "unsupported" ? "Continue without biometrics" : "Try again"}
              </Text>
            </Pressable>
            {phase === "unsupported" ? (
              <Pressable
                style={s.secondary}
                onPress={() => setPhase("unlocked")}
                testID="biometric-bypass"
              >
                <Text style={s.secondaryText}>Open VaultLedger</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, justifyContent: "space-between", padding: 24 },
  hero: { alignItems: "center", marginTop: 80, paddingHorizontal: 8 },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: C.pale,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: { color: C.ink, fontSize: 26, fontWeight: "800", textAlign: "center" },
  body: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
    maxWidth: 320,
  },
  actions: { gap: 12, paddingBottom: 12 },
  busy: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 },
  busyText: { color: C.muted, fontWeight: "700" },
  error: { color: C.red, textAlign: "center", fontSize: 13 },
  primary: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: C.brand,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  primaryText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  secondary: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryText: { color: C.ink, fontWeight: "700" },
});
