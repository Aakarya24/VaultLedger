import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { C } from "@/src/shared/theme";

type Props = {
  visible: boolean;
  title: string;
  saveLabel?: string;
  onSave: () => void;
  onClose: () => void;
  saveDisabled?: boolean;
  children: React.ReactNode;
  testID?: string;
};

// Standard sheet used across create-forms.
// - Save is a sticky action at the TOP of the sheet (keeps it reachable when
//   the keyboard is open on small viewports — a bug we saw in earlier iterations).
// - On web, we bypass RN's <Modal> (which portals to document.body and can size
//   to full document height, pushing the sheet below the fold) and render a
//   fixed-position overlay bound to the viewport instead.

const IS_WEB = Platform.OS === "web";

function SheetBody({
  title,
  saveLabel,
  onSave,
  onClose,
  saveDisabled,
  children,
  testID,
}: Omit<Props, "visible">) {
  return (
    <View style={s.sheet} testID={testID}>
      <View style={s.handle} />
      <View style={s.stickyHead}>
        <Text style={s.title}>{title}</Text>
        <Pressable
          testID="sheet-save"
          style={[s.save, saveDisabled && s.saveDisabled]}
          onPress={onSave}
          disabled={saveDisabled}
        >
          <Text style={s.saveText}>{saveLabel || "Save securely"}</Text>
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        {children}
        <Pressable style={s.cancel} onPress={onClose} testID="sheet-cancel">
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export function BottomSheetForm(props: Props) {
  const { visible, onClose } = props;

  if (IS_WEB) {
    if (!visible) return null;
    // Fixed overlay bound to viewport — sidesteps RN Modal's document-height sizing on web.
    return (
      <View style={s.webOverlay} testID={`${props.testID}-web-overlay`}>
        <Pressable style={s.webBackdrop} onPress={onClose} />
        <View style={[s.webSheetWrap, { pointerEvents: "box-none" }]}>
          <SheetBody {...props} />
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <SheetBody {...props} />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  // Native Modal path
  backdrop: { flex: 1, backgroundColor: "rgba(26,26,24,0.45)", justifyContent: "flex-end" },

  // Web overlay path (bound to viewport)
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
    backgroundColor: "rgba(26,26,24,0.45)",
  },
  webSheetWrap: {
    // @ts-expect-error react-native-web accepts CSS position values
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
  },

  sheet: {
    maxHeight: "88%",
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  handle: {
    width: 42,
    height: 4,
    backgroundColor: C.line,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 12,
  },
  stickyHead: {
    paddingHorizontal: 24,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  title: { color: C.ink, fontSize: 22, fontWeight: "800", marginBottom: 12 },
  save: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  body: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 12 },
  cancel: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  cancelText: { color: C.muted, fontWeight: "700" },
});
