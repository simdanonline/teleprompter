import { useRef, useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useTeleprompter } from "../context/TeleprompterContext";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

// Optional: only works in dev builds, not Expo Go
let VolumeManager: any = null;
try {
  VolumeManager = require("react-native-volume-manager").VolumeManager;
} catch {
  // Not linked — running in Expo Go
}

const COUNTDOWN_OPTIONS = [0, 3, 5, 10];

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    text,
    scrollSpeed,
    setScrollSpeed,
    fontSize,
    setFontSize,
    overlayOpacity,
    setOverlayOpacity,
  } = useTeleprompter();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] =
    MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [countdownDelay, setCountdownDelay] = useState(3);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const scrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentHeight = useRef(0);
  const containerHeight = useRef(0);
  const isRecordingRef = useRef(false);
  const isCountingDown = useRef(false);
  const triggerRecordRef = useRef<() => void>(() => {});
  const cancelCountdownRef = useRef<() => void>(() => {});

  const previewPlayer = useVideoPlayer(previewUri, (player) => {
    player.loop = true;
    player.play();
  });

  // Keep ref in sync for volume listener
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Suppress system volume UI and listen for volume buttons (dev builds only)
  useEffect(() => {
    if (!VolumeManager) return;

    VolumeManager.showNativeVolumeUI({ enabled: false });
    const listener = VolumeManager.addVolumeListener(() => {
      if (isCountingDown.current) {
        cancelCountdownRef.current();
      } else {
        triggerRecordRef.current();
      }
    });

    return () => {
      listener.remove();
      VolumeManager.showNativeVolumeUI({ enabled: true });
    };
  }, []);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      if (!cameraPermission?.granted) await requestCameraPermission();
      if (!micPermission?.granted) await requestMicPermission();
      if (!mediaPermission?.granted) await requestMediaPermission();
    })();
  }, []);

  // Auto-scrolling logic
  useEffect(() => {
    if (isScrolling) {
      const pixelsPerInterval = scrollSpeed / 50;
      scrollTimer.current = setInterval(() => {
        const maxScroll = contentHeight.current - containerHeight.current;
        if (maxScroll <= 0) return;

        scrollY.current = Math.min(
          scrollY.current + pixelsPerInterval,
          maxScroll
        );
        scrollViewRef.current?.scrollTo({
          y: scrollY.current,
          animated: false,
        });

        if (scrollY.current >= maxScroll) {
          setIsScrolling(false);
        }
      }, 16);
    } else if (scrollTimer.current) {
      clearInterval(scrollTimer.current);
      scrollTimer.current = null;
    }

    return () => {
      if (scrollTimer.current) clearInterval(scrollTimer.current);
    };
  }, [isScrolling, scrollSpeed]);

  // Recording duration timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimer.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } else if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }

    return () => {
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecordingRef.current) return;

    setIsRecording(true);
    setIsScrolling(true);
    try {
      const video = await cameraRef.current.recordAsync();
      if (video) {
        setPreviewUri(video.uri);
      }
    } catch (err) {
      console.error("Recording error:", err);
      Alert.alert("Error", "Failed to record video.");
    }
    setIsRecording(false);
  }, []);

  const saveRecording = useCallback(async () => {
    if (!previewUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        await MediaLibrary.saveToLibraryAsync(previewUri);
        Alert.alert("Video Saved", "Your recording has been saved to your photo library.", [{ text: "OK" }]);
      } else {
        Alert.alert("Permission Needed", "Media library access is required to save recordings.", [{ text: "OK" }]);
      }
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Error", "Failed to save recording.");
    }
    setPreviewUri(null);
  }, [previewUri]);

  const discardRecording = useCallback(() => {
    setPreviewUri(null);
  }, []);

  const stopRecording = useCallback(() => {
    if (!cameraRef.current || !isRecordingRef.current) return;
    cameraRef.current.stopRecording();
    setIsRecording(false);
    setIsScrolling(false);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    isCountingDown.current = false;
    setCountdown(null);
  }, []);

  const startCountdown = useCallback(
    (onComplete: () => void) => {
      if (countdownDelay === 0) {
        onComplete();
        return;
      }

      isCountingDown.current = true;
      setCountdown(countdownDelay);
      let remaining = countdownDelay;

      countdownTimer.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(countdownTimer.current!);
          countdownTimer.current = null;
          isCountingDown.current = false;
          setCountdown(null);
          onComplete();
        } else {
          setCountdown(remaining);
        }
      }, 1000);
    },
    [countdownDelay]
  );

  const triggerRecord = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    } else if (!isCountingDown.current) {
      startCountdown(() => startRecording());
    }
  }, [startRecording, stopRecording, startCountdown]);

  // Keep refs in sync for volume listener
  useEffect(() => {
    triggerRecordRef.current = triggerRecord;
  }, [triggerRecord]);

  useEffect(() => {
    cancelCountdownRef.current = cancelCountdown;
  }, [cancelCountdown]);

  const handleRecord = useCallback(() => {
    triggerRecord();
  }, [triggerRecord]);

  const toggleScroll = useCallback(() => {
    setIsScrolling((prev) => !prev);
  }, []);

  const resetScroll = useCallback(() => {
    scrollY.current = 0;
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const cycleCountdown = useCallback(() => {
    setCountdownDelay((prev) => {
      const idx = COUNTDOWN_OPTIONS.indexOf(prev);
      return COUNTDOWN_OPTIONS[(idx + 1) % COUNTDOWN_OPTIONS.length];
    });
  }, []);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.permissionText}>
          Camera and microphone access are needed for the teleprompter.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (previewUri) {
    return (
      <View style={styles.container}>
        <VideoView
          player={previewPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls
        />
        <View style={[styles.previewTopBar, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.previewTitle}>Preview</Text>
        </View>
        <View style={[styles.previewBottomBar, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity style={styles.previewDiscardButton} onPress={discardRecording}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <Text style={styles.previewButtonText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewSaveButton} onPress={saveRecording}>
            <Ionicons name="download-outline" size={24} color="#fff" />
            <Text style={styles.previewButtonText}>Save to Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="video"
      />

      {/* Text overlay */}
      <View
        style={[
          styles.textOverlay,
          {
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            top: insets.top + 50,
            bottom: 200,
          },
        ]}
        pointerEvents="box-none"
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.textScroll}
          contentContainerStyle={styles.textScrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isScrolling}
          onContentSizeChange={(w, h) => {
            contentHeight.current = h;
          }}
          onLayout={(e) => {
            containerHeight.current = e.nativeEvent.layout.height;
          }}
          onScroll={(e) => {
            if (!isScrolling) {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }
          }}
          scrollEventThrottle={16}
        >
          <Text style={[styles.promptText, { fontSize }]}>{text}</Text>
        </ScrollView>
      </View>

      {/* Countdown overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.topButton}
          onPress={() => {
            cancelCountdown();
            if (isRecording) {
              cameraRef.current?.stopRecording();
              setIsRecording(false);
            }
            setIsScrolling(false);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {isRecording && (
          <View style={styles.recordingBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingTime}>
              {formatDuration(recordingDuration)}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.topButton}
          onPress={() => setShowControls((prev) => !prev)}
        >
          <Ionicons
            name={showControls ? "settings" : "settings-outline"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* Controls panel */}
      {showControls && (
        <View style={[styles.controlsPanel, { bottom: 110 + insets.bottom }]}>
          {/* Countdown timer */}
          <View style={styles.controlRow}>
            <Ionicons name="timer-outline" size={18} color="#aaa" />
            <Text style={styles.controlLabel}>Timer</Text>
            <View style={styles.timerOptions}>
              {COUNTDOWN_OPTIONS.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.timerChip,
                    countdownDelay === val && styles.timerChipActive,
                  ]}
                  onPress={() => setCountdownDelay(val)}
                >
                  <Text
                    style={[
                      styles.timerChipText,
                      countdownDelay === val && styles.timerChipTextActive,
                    ]}
                  >
                    {val === 0 ? "Off" : `${val}s`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          {/* Scroll speed */}
          <ControlRow
            icon="speedometer-outline"
            label="Speed"
            value={scrollSpeed}
            min={10}
            max={150}
            step={10}
            onChange={setScrollSpeed}
          />
          {/* Font size */}
          <ControlRow
            icon="text-outline"
            label="Size"
            value={fontSize}
            min={16}
            max={64}
            step={4}
            onChange={setFontSize}
            displayValue={`${fontSize}px`}
          />
          {/* Overlay opacity */}
          <ControlRow
            icon="contrast-outline"
            label="Opacity"
            value={Math.round(overlayOpacity * 100)}
            min={10}
            max={90}
            step={10}
            onChange={(v) => setOverlayOpacity(v / 100)}
            displayValue={`${Math.round(overlayOpacity * 100)}%`}
          />
        </View>
      )}

      {/* Bottom controls */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        {/* Reset scroll */}
        <TouchableOpacity style={styles.sideButton} onPress={resetScroll}>
          <Ionicons name="refresh" size={28} color="#fff" />
          <Text style={styles.sideButtonText}>Reset</Text>
        </TouchableOpacity>

        {/* Record button */}
        <View style={styles.recordArea}>
          {!isRecording && countdown === null && countdownDelay > 0 && (
            <Text style={styles.timerLabel}>{countdownDelay}s</Text>
          )}
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={handleRecord}
            activeOpacity={0.7}
            disabled={countdown !== null}
          >
            <View
              style={[
                styles.recordButtonInner,
                isRecording && styles.recordButtonInnerActive,
                countdown !== null && styles.recordButtonInnerCountdown,
              ]}
            />
          </TouchableOpacity>
          <Text style={styles.volumeHint}>Vol +/- to record</Text>
        </View>

        {/* Play/Pause scroll */}
        <TouchableOpacity style={styles.sideButton} onPress={toggleScroll}>
          <Ionicons
            name={isScrolling ? "pause" : "play"}
            size={28}
            color="#fff"
          />
          <Text style={styles.sideButtonText}>
            {isScrolling ? "Pause" : "Scroll"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ControlRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayValue?: string;
}) {
  return (
    <View style={styles.controlRow}>
      <Ionicons name={icon} size={18} color="#aaa" />
      <Text style={styles.controlLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >
        <Ionicons
          name="remove"
          size={20}
          color={value <= min ? "#444" : "#fff"}
        />
      </TouchableOpacity>
      <Text style={styles.controlValue}>{displayValue ?? value}</Text>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
      >
        <Ionicons
          name="add"
          size={20}
          color={value >= max ? "#444" : "#fff"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Permissions
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  permissionText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: "#4dabf7",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backLink: {
    marginTop: 16,
  },
  backLinkText: {
    color: "#4dabf7",
    fontSize: 15,
  },
  // Text overlay
  textOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  promptText: {
    color: "#fff",
    fontWeight: "600",
    lineHeight: 48,
    textAlign: "center",
  },
  // Countdown
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "800",
    color: "#fff",
    fontVariant: ["tabular-nums"],
  },
  // Top bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 8,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff4444",
  },
  recordingTime: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  // Controls panel
  controlsPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  controlLabel: {
    color: "#aaa",
    fontSize: 13,
    width: 55,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  controlValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    width: 48,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  // Timer chips
  timerOptions: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  timerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  timerChipActive: {
    backgroundColor: "#4dabf7",
  },
  timerChipText: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "500",
  },
  timerChipTextActive: {
    color: "#fff",
  },
  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sideButton: {
    alignItems: "center",
    gap: 4,
    width: 60,
  },
  sideButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  recordArea: {
    alignItems: "center",
    gap: 4,
  },
  timerLabel: {
    color: "#4dabf7",
    fontSize: 12,
    fontWeight: "600",
  },
  volumeHint: {
    color: "#666",
    fontSize: 10,
    fontWeight: "400",
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
  },
  recordButtonActive: {
    borderColor: "#ff4444",
  },
  recordButtonInner: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    backgroundColor: "#ff4444",
  },
  recordButtonInnerActive: {
    borderRadius: 8,
    width: 28,
    height: 28,
  },
  recordButtonInnerCountdown: {
    backgroundColor: "#ff8844",
  },
  // Preview screen
  previewTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  previewTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  previewBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewDiscardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  previewSaveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#4dabf7",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  previewButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
