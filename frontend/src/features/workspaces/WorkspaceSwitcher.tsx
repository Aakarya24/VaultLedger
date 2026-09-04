import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFinance } from "@/src/presentation/FinanceProvider";
import { Workspace } from "@/src/domain/finance";
import { C } from "@/src/shared/theme";

const IS_WEB = Platform.OS === "web";
type Props = { onCreate: () => void };

function MenuBody({
  workspaces,
  activeId,
  onSelect,
  onCreate,
}: {
  workspaces: Workspace[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <View style={s.menu} testID="workspace-switcher-menu">
      <Text style={s.title}>Switch workspace</Text>
      {workspaces.map((w) => (
        <Pressable
          key={w.id}
          testID={`switch-workspace-${w.id}`}
          onPress={() => onSelect(w.id)}
          style={[s.item, w.id === activeId && s.itemActive]}
        >
          <Ionicons
            name={w.id === activeId ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={w.id === activeId ? C.brand : C.muted}
          />
          <Text style={s.itemText}>{w.name}</Text>
        </Pressable>
      ))}
      <Pressable
        style={s.create}
        onPress={onCreate}
        testID="create-workspace-from-switcher"
      >
        <Ionicons name="add-circle-outline" size={18} color={C.brand} />
        <Text style={s.createText}>New workspace</Text>
      </Pressable>
    </View>
  );
}

export function WorkspaceSwitcher({ onCreate }: Props) {
  const { workspaces, activeWorkspace, selectWorkspace } = useFinance();
  const [open, setOpen] = useState(false);
  if (!activeWorkspace) return null;

  const close = () => setOpen(false);
  const handleSelect = async (id: string) => {
    await selectWorkspace(id);
    close();
  };
  const handleCreate = () => {
    close();
    onCreate();
  };

  return (
    <>
      <Pressable style={s.pill} onPress={() => setOpen(true)} testID="workspace-switcher">
        <Ionicons name="grid-outline" size={16} color={C.brand} />
        <Text style={s.label}>Workspace</Text>
        <Text style={s.value} numberOfLines={1}>
          {activeWorkspace.name}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.muted} />
      </Pressable>
      {open ? (
        IS_WEB ? (
          <View style={s.webOverlay} testID="workspace-switcher-overlay">
            <Pressable style={s.webBackdrop} onPress={close} />
            <View style={[s.webCenter, { pointerEvents: "box-none" }]}>
              <MenuBody
                workspaces={workspaces}
                activeId={activeWorkspace.id}
                onSelect={handleSelect}
                onCreate={handleCreate}
              />
            </View>
          </View>
        ) : (
          <Modal transparent animationType="fade" onRequestClose={close} visible>
            <Pressable style={s.backdrop} onPress={close}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <MenuBody
                  workspaces={workspaces}
                  activeId={activeWorkspace.id}
                  onSelect={handleSelect}
                  onCreate={handleCreate}
                />
              </Pressable>
            </Pressable>
          </Modal>
        )
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  pill: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: { color: C.muted, fontSize: 12 },
  value: { color: C.ink, fontWeight: "700", flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,24,0.35)",
    justifyContent: "center",
    padding: 24,
  },
  webOverlay: {
    // @ts-expect-error react-native-web accepts CSS position values
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  webBackdrop: {
    // @ts-expect-error react-native-web accepts CSS position values
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(26,26,24,0.35)",
  },
  webCenter: {
    // @ts-expect-error react-native-web accepts CSS position values
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  menu: { backgroundColor: C.bg, borderRadius: 20, padding: 20, gap: 8, minWidth: 260 },
  title: { color: C.ink, fontSize: 18, fontWeight: "800", marginBottom: 8 },
  item: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemActive: { backgroundColor: C.pale },
  itemText: { color: C.ink, fontWeight: "700" },
  create: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: C.line,
    marginTop: 6,
  },
  createText: { color: C.brand, fontWeight: "800" },
});
