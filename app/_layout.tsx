import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { TeleprompterProvider } from "../context/TeleprompterContext";
import { SavedScriptsProvider } from "../context/SavedScriptsContext";

export default function RootLayout() {
  return (
    <SavedScriptsProvider>
      <TeleprompterProvider>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Teleprompter",
              headerStyle: { backgroundColor: "#000" },
              headerTitleStyle: { color: "#fff" },
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="camera"
            options={{
              headerShown: false,
              presentation: "fullScreenModal",
            }}
          />
        </Stack>
      </TeleprompterProvider>
    </SavedScriptsProvider>
  );
}
