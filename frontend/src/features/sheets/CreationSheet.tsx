import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { BottomSheetForm } from "@/src/shared/ui/BottomSheetForm";
import { C } from "@/src/shared/theme";

type Mode = null | "workspace" | "account" | "expense" | "budget";
type Props = { mode: Mode; onClose: () => void };

export function CreationSheet({ mode, onClose }: Props) {
  const f = useFinance();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode === "expense") setAccountId(f.accounts[0]?.id || "");
    if (!mode) {
      setName("");
      setAmount("");
      setNote("");
      setBusy(false);
    }
  }, [mode, f.accounts]);

  if (!mode) return null;

  const title =
    mode === "workspace"
      ? "New workspace"
      : mode === "account"
        ? "New account"
        : mode === "budget"
          ? "New budget"
          : "Add expense";

  const canSave =
    mode === "workspace"
      ? name.trim().length > 0
      : mode === "account"
        ? name.trim().length > 0
        : mode === "budget"
          ? name.trim().length > 0 && Number(amount) > 0
          : accountId !== "" && Number(amount) > 0;

  const submit = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      if (mode === "workspace") await f.createWorkspace(name.trim());
      if (mode === "account") await f.createAccount(name.trim());
      if (mode === "budget")
        await f.createBudget(name.trim(), Math.round(Number(amount) * 100));
      if (mode === "expense")
        await f.addExpense(
          Math.round(Number(amount) * 100),
          note.trim() || "Expense",
          accountId,
        );
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <BottomSheetForm
      visible
      testID={`sheet-${mode}`}
      title={title}
      onSave={submit}
      onClose={onClose}
      saveDisabled={!canSave || busy}
    >
      {mode === "expense" ? (
        <>
          <TextInput
            style={s.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Amount in INR"
            placeholderTextColor={C.muted}
            keyboardType="decimal-pad"
            testID="expense-amount"
          />
          {/* Sticky-friendly horizontal chip row for account picking. */}
          {f.accounts.length ? (
            <View>
              <Text style={s.label}>ACCOUNT</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipRow}
              >
                {f.accounts.map((a) => {
                  const active = accountId === a.id;
                  return (
                    <Pressable
                      key={a.id}
                      testID={`expense-account-${a.id}`}
                      onPress={() => setAccountId(a.id)}
                      style={[s.chip, active && s.chipActive]}
                    >
                      <Text style={active ? s.chipActiveText : s.chipText}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
          <TextInput
            style={s.input}
            value={note}
            onChangeText={setNote}
            placeholder="What was this for?"
            placeholderTextColor={C.muted}
            testID="expense-note"
          />
          {!f.accounts.length && (
            <Text style={s.error}>Create an account before adding an expense.</Text>
          )}
        </>
      ) : mode === "budget" ? (
        <>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Household ceiling"
            placeholderTextColor={C.muted}
            testID="budget-name"
          />
          <TextInput
            style={s.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="Monthly limit in INR"
            placeholderTextColor={C.muted}
            keyboardType="decimal-pad"
            testID="budget-amount"
          />
        </>
      ) : (
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder={mode === "workspace" ? "Personal" : "Main account"}
          placeholderTextColor={C.muted}
          testID={`${mode}-name`}
        />
      )}
    </BottomSheetForm>
  );
}

const s = StyleSheet.create({
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    backgroundColor: C.card,
    paddingHorizontal: 16,
    color: C.ink,
    fontSize: 16,
  },
  label: {
    color: C.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 8,
  },
  chipRow: { gap: 8, paddingRight: 16 },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chipActive: { backgroundColor: C.pale, borderColor: C.brand },
  chipText: { color: C.muted, fontWeight: "700" },
  chipActiveText: { color: C.brand, fontWeight: "800" },
  error: { color: C.red, fontSize: 13 },
});
