import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type IoniconName = keyof typeof Ionicons.glyphMap;

type PermissionItem = {
  icon: IoniconName;
  title: string;
  description: string;
};

const PERMISSION_ITEMS: PermissionItem[] = [
  {
    icon: "videocam",
    title: "Camera",
    description: "Records video while the script scrolls in front of you.",
  },
  {
    icon: "mic",
    title: "Microphone",
    description: "Captures audio so your recording has sound.",
  },
  {
    icon: "images",
    title: "Photo Library",
    description:
      "Asked only when you save — keeps your finished recording in your gallery.",
  },
];

export type PermissionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onContinue: () => Promise<{ camera: boolean; microphone: boolean }>;
  onProceed: () => void;
};

export function PermissionsSheet({
  visible,
  onClose,
  onContinue,
  onProceed,
}: PermissionsSheetProps) {
  const insets = useSafeAreaInsets();
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleContinue = async () => {
    setRequesting(true);
    setDenied(false);
    try {
      const result = await onContinue();
      if (result.camera && result.microphone) {
        onProceed();
      } else {
        setDenied(true);
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleClose = () => {
    setDenied(false);
    onClose();
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.iconBubble}>
              <Ionicons name="shield-checkmark" size={28} color="#4dabf7" />
            </View>
            <Text style={styles.title}>Before we start</Text>
            <Text style={styles.subtitle}>
              Teleprompter needs a few permissions to record. Here's why — you
              stay in control.
            </Text>
          </View>

          <View style={styles.list}>
            {PERMISSION_ITEMS.map((item) => (
              <View key={item.title} style={styles.item}>
                <View style={styles.itemIcon}>
                  <Ionicons name={item.icon} size={20} color="#4dabf7" />
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {denied ? (
            <View style={styles.deniedBox}>
              <Ionicons name="alert-circle" size={18} color="#ffb454" />
              <Text style={styles.deniedText}>
                Camera or microphone access was denied. Enable them in
                {Platform.OS === "ios" ? " Settings" : " app settings"} to record.
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            {denied ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={openSettings}
                activeOpacity={0.85}
              >
                <Ionicons name="settings-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Open Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  requesting && styles.primaryButtonDisabled,
                ]}
                onPress={handleContinue}
                disabled={requesting}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {requesting ? "Requesting…" : "Continue"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(77,171,247,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  subtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  list: {
    gap: 14,
    marginBottom: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(77,171,247,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemDescription: {
    color: "#999",
    fontSize: 13,
    lineHeight: 18,
  },
  deniedBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,180,84,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  deniedText: {
    flex: 1,
    color: "#ffb454",
    fontSize: 13,
    lineHeight: 18,
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
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "500",
  },
});
