import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SaveScriptMode = "new" | "existing";

export type SaveScriptSheetProps = {
  visible: boolean;
  initialTitle: string;
  hasExisting: boolean;
  existingTitle?: string;
  onClose: () => void;
  onSubmit: (input: { title: string; mode: SaveScriptMode }) => Promise<void> | void;
};

function deriveDefaultTitle(initial: string): string {
  if (initial.trim()) return initial.trim();
  return "";
}

export function SaveScriptSheet({
  visible,
  initialTitle,
  hasExisting,
  existingTitle,
  onClose,
  onSubmit,
}: SaveScriptSheetProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(deriveDefaultTitle(initialTitle));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTitle(deriveDefaultTitle(initialTitle));
      setSubmitting(false);
    }
  }, [visible, initialTitle]);

  const handle = async (mode: SaveScriptMode) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ title: title.trim(), mode });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 16 },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.iconBubble}>
              <Ionicons name="bookmark" size={22} color="#4dabf7" />
            </View>
            <Text style={styles.title}>
              {hasExisting ? "Save changes" : "Save script"}
            </Text>
            <Text style={styles.subtitle}>
              {hasExisting
                ? `Update "${existingTitle ?? "this script"}" or save a new copy.`
                : "Give your script a title so you can find it later."}
            </Text>
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Product launch intro"
            placeholderTextColor="#555"
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            maxLength={120}
          />

          <View style={styles.actions}>
            {hasExisting ? (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={() => handle("existing")}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Ionicons name="save-outline" size={18} color="#fff" />
                  <Text style={styles.primaryButtonText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  onPress={() => handle("new")}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Ionicons name="duplicate-outline" size={18} color="#4dabf7" />
                  <Text style={styles.secondaryButtonText}>Save as new</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  submitting && styles.buttonDisabled,
                ]}
                onPress={() => handle("new")}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Ionicons name="save-outline" size={18} color="#fff" />
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    marginBottom: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(77,171,247,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: "#888",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#4dabf7",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4dabf7",
  },
  secondaryButtonText: {
    color: "#4dabf7",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "500",
  },
});
