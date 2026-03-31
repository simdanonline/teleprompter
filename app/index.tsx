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
import { useTeleprompter } from "../context/TeleprompterContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { text, setText } = useTeleprompter();
  const router = useRouter();

  const canStart = text.trim().length > 0;

  const {top} = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.mainHeader}>
        <Text style={styles.logo}>Teleprompter</Text>
        <TouchableOpacity style={styles.headerStartButton} onPress={() => canStart && router.push("/camera")}>
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
              onPress={() => setText("")}
            >
              <Ionicons name="close-circle" size={22} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.charCount}>{text.length} characters</Text>

        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          onPress={() => canStart && router.push("/camera")}
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
    marginBottom: 30,
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
