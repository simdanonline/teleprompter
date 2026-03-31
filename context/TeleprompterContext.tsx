import React, { createContext, useContext, useState } from "react";

interface TeleprompterState {
  text: string;
  setText: (text: string) => void;
  scrollSpeed: number;
  setScrollSpeed: (speed: number) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  overlayOpacity: number;
  setOverlayOpacity: (opacity: number) => void;
}

const TeleprompterContext = createContext<TeleprompterState | null>(null);

export function TeleprompterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [text, setText] = useState("");
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [fontSize, setFontSize] = useState(32);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  return (
    <TeleprompterContext.Provider
      value={{
        text,
        setText,
        scrollSpeed,
        setScrollSpeed,
        fontSize,
        setFontSize,
        overlayOpacity,
        setOverlayOpacity,
      }}
    >
      {children}
    </TeleprompterContext.Provider>
  );
}

export function useTeleprompter() {
  const context = useContext(TeleprompterContext);
  if (!context) {
    throw new Error("useTeleprompter must be used within TeleprompterProvider");
  }
  return context;
}
