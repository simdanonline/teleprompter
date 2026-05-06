import { useMemo } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SavedScript } from "../context/SavedScriptsContext";

export type SavedScriptsSheetProps = {
  visible: boolean;
  scripts: SavedScript[];
  onClose: () => void;
  onLoad: (script: SavedScript) => void;
  onDelete: (script: SavedScript) => void;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function preview(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 80) return trimmed;
  return trimmed.slice(0, 80) + "…";
}

export function SavedScriptsSheet({
  visible,
  scripts,
  onClose,
  onLoad,
  onDelete,
}: SavedScriptsSheetProps) {
  const insets = useSafeAreaInsets();
  const sorted = useMemo(
    () => [...scripts].sort((a, b) => b.updatedAt - a.updatedAt),
    [scripts]
  );

  const confirmDelete = (script: SavedScript) => {
    Alert.alert(
      "Delete script?",
      `"${script.title}" will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(script),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
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
            <Text style={styles.title}>Saved Scripts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#888" />
            </TouchableOpacity>
          </View>

          {sorted.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={36} color="#444" />
              <Text style={styles.emptyTitle}>No saved scripts yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap Save on the home screen to keep a script for later.
              </Text>
            </View>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <TouchableOpacity
                    style={styles.itemBody}
                    onPress={() => onLoad(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.itemPreview} numberOfLines={2}>
                      {preview(item.content) || "(empty)"}
                    </Text>
                    <Text style={styles.itemMeta}>
                      Updated {formatDate(item.updatedAt)} ·{" "}
                      {item.content.length} chars
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDelete(item)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff6b6b" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
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
    maxHeight: "85%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#333",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: "#ccc",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  emptySubtitle: {
    color: "#777",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  listContent: {
    gap: 10,
    paddingBottom: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  itemBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  itemPreview: {
    color: "#999",
    fontSize: 13,
    lineHeight: 18,
  },
  itemMeta: {
    color: "#666",
    fontSize: 11,
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#222",
  },
});
