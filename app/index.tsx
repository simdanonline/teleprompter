import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useTeleprompter } from "../context/TeleprompterContext";
import {
  SavedScript,
  useSavedScripts,
} from "../context/SavedScriptsContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PermissionsSheet } from "../components/PermissionsSheet";
import { SavedScriptsSheet } from "../components/SavedScriptsSheet";
import {
  SaveScriptSheet,
  SaveScriptMode,
} from "../components/SaveScriptSheet";

function deriveTitleFromContent(content: string): string {
  const firstLine = content.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
  if (!firstLine) return "";
  return firstLine.length > 60 ? firstLine.slice(0, 60) + "…" : firstLine;
}

export default function HomeScreen() {
  const { text, setText, currentScriptId, setCurrentScriptId } =
    useTeleprompter();
  const { scripts, saveScript, updateScript, deleteScript, getScript } =
    useSavedScripts();
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [permissionsVisible, setPermissionsVisible] = useState(false);
  const [libraryVisible, setLibraryVisible] = useState(false);
  const [saveVisible, setSaveVisible] = useState(false);

  const canStart = text.trim().length > 0;
  const canSave = text.trim().length > 0;

  const currentScript = useMemo(
    () => (currentScriptId ? getScript(currentScriptId) : undefined),
    [currentScriptId, getScript]
  );

  const goToCamera = useCallback(() => {
    router.push("/camera");
  }, [router]);

  const handleStart = useCallback(() => {
    if (!canStart) return;
    if (cameraPermission?.granted && micPermission?.granted) {
      goToCamera();
    } else {
      setPermissionsVisible(true);
    }
  }, [canStart, cameraPermission, micPermission, goToCamera]);

  const handleSheetContinue = useCallback(async () => {
    const cam = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();
    const mic = micPermission?.granted
      ? micPermission
      : await requestMicPermission();
    return {
      camera: !!cam?.granted,
      microphone: !!mic?.granted,
    };
  }, [
    cameraPermission,
    micPermission,
    requestCameraPermission,
    requestMicPermission,
  ]);

  const handleSheetProceed = useCallback(() => {
    setPermissionsVisible(false);
    goToCamera();
  }, [goToCamera]);

  const handleClear = useCallback(() => {
    setText("");
    setCurrentScriptId(null);
  }, [setText, setCurrentScriptId]);

  const handleLoadScript = useCallback(
    (script: SavedScript) => {
      setText(script.content);
      setCurrentScriptId(script.id);
      setLibraryVisible(false);
    },
    [setText, setCurrentScriptId]
  );

  const handleDeleteScript = useCallback(
    async (script: SavedScript) => {
      await deleteScript(script.id);
      if (currentScriptId === script.id) {
        setCurrentScriptId(null);
      }
    },
    [deleteScript, currentScriptId, setCurrentScriptId]
  );

  const handleSubmitSave = useCallback(
    async ({ title, mode }: { title: string; mode: SaveScriptMode }) => {
      const finalTitle = title.trim() || deriveTitleFromContent(text) || "Untitled";
      if (mode === "existing" && currentScript) {
        await updateScript(currentScript.id, {
          title: finalTitle,
          content: text,
        });
      } else {
        const created = await saveScript({ title: finalTitle, content: text });
        setCurrentScriptId(created.id);
      }
      setSaveVisible(false);
    },
    [text, currentScript, saveScript, updateScript, setCurrentScriptId]
  );

  const { top } = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.mainHeader}>
        <Text style={styles.logo}>Teleprompter</Text>
        <TouchableOpacity style={styles.headerStartButton} onPress={handleStart}>
          <Text style={styles.logoSubtitle}>Start</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Ionicons name="text" size={40} color="#4dabf7" />
          <Text style={styles.title}>Your Script</Text>
          <Text style={styles.subtitle}>
            Paste or type the text you want to read while recording.
          </Text>
        </View>

        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={() => setLibraryVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-open-outline" size={18} color="#4dabf7" />
            <Text style={styles.toolButtonText}>
              Library{scripts.length > 0 ? ` (${scripts.length})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolButton, !canSave && styles.toolButtonDisabled]}
            onPress={() => setSaveVisible(true)}
            disabled={!canSave}
            activeOpacity={0.8}
          >
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={canSave ? "#4dabf7" : "#555"}
            />
            <Text
              style={[
                styles.toolButtonText,
                !canSave && styles.toolButtonTextDisabled,
              ]}
            >
              {currentScript ? "Save" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {currentScript ? (
          <View style={styles.loadedBadge}>
            <Ionicons name="bookmark" size={14} color="#4dabf7" />
            <Text style={styles.loadedBadgeText} numberOfLines={1}>
              Editing: {currentScript.title}
            </Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Paste your script here..."
            placeholderTextColor="#666"
            multiline
            textAlignVertical="top"
            value={text}
            onChangeText={setText}
            autoCorrect={false}
          />
          {text.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
            >
              <Ionicons name="close-circle" size={22} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.charCount}>{text.length} characters</Text>

        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={handleStart}
          disabled={!canStart}
          activeOpacity={0.8}
        >
          <Ionicons
            name="videocam"
            size={24}
            color={canStart ? "#fff" : "#666"}
          />
          <Text
            style={[
              styles.startButtonText,
              !canStart && styles.startButtonTextDisabled,
            ]}
          >
            Start Teleprompter
          </Text>
        </TouchableOpacity>
      </ScrollView>
      <PermissionsSheet
        visible={permissionsVisible}
        onClose={() => setPermissionsVisible(false)}
        onContinue={handleSheetContinue}
        onProceed={handleSheetProceed}
      />
      <SavedScriptsSheet
        visible={libraryVisible}
        scripts={scripts}
        onClose={() => setLibraryVisible(false)}
        onLoad={handleLoadScript}
        onDelete={handleDeleteScript}
      />
      <SaveScriptSheet
        visible={saveVisible}
        initialTitle={currentScript?.title ?? deriveTitleFromContent(text)}
        hasExisting={!!currentScript}
        existingTitle={currentScript?.title}
        onClose={() => setSaveVisible(false)}
        onSubmit={handleSubmitSave}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  toolbar: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  toolButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#222",
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonText: {
    color: "#4dabf7",
    fontSize: 14,
    fontWeight: "600",
  },
  toolButtonTextDisabled: {
    color: "#555",
  },
  loadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(77,171,247,0.1)",
    borderRadius: 8,
    marginBottom: 10,
  },
  loadedBadgeText: {
    color: "#4dabf7",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  inputContainer: {
    position: "relative",
    flex: 1,
    minHeight: 250,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    paddingTop: 16,
    paddingRight: 40,
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 250,
    maxHeight: 400,
  },
  clearButton: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  charCount: {
    color: "#666",
    fontSize: 13,
    textAlign: "right",
    marginTop: 8,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#4dabf7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  startButtonDisabled: {
    backgroundColor: "#222",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  startButtonTextDisabled: {
    color: "#666",
  },
  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: "#4dabf7",
    textAlign: "center",
    marginBottom: 8,
  },
  logoSubtitle: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
  },
  headerStartButton: {
    backgroundColor: "#4dabf7",
    padding: 12,
    borderRadius: 12,
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
});
