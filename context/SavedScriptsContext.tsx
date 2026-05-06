import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SavedScript {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface SavedScriptsState {
  scripts: SavedScript[];
  loaded: boolean;
  saveScript: (input: { title: string; content: string }) => Promise<SavedScript>;
  updateScript: (
    id: string,
    input: { title?: string; content?: string }
  ) => Promise<SavedScript | null>;
  deleteScript: (id: string) => Promise<void>;
  getScript: (id: string) => SavedScript | undefined;
}

const STORAGE_KEY = "teleprompter:saved-scripts:v1";

const SavedScriptsContext = createContext<SavedScriptsState | null>(null);

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortNewestFirst(items: SavedScript[]): SavedScript[] {
  return [...items].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function SavedScriptsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scripts, setScripts] = useState<SavedScript[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw) {
          const parsed: SavedScript[] = JSON.parse(raw);
          setScripts(sortNewestFirst(parsed));
        }
      } catch {
        // Corrupt or missing — start with empty list.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (next: SavedScript[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const saveScript = useCallback(
    async ({ title, content }: { title: string; content: string }) => {
      const now = Date.now();
      const script: SavedScript = {
        id: makeId(),
        title: title.trim() || "Untitled",
        content,
        createdAt: now,
        updatedAt: now,
      };
      const next = sortNewestFirst([script, ...scripts]);
      setScripts(next);
      await persist(next);
      return script;
    },
    [scripts, persist]
  );

  const updateScript = useCallback(
    async (
      id: string,
      input: { title?: string; content?: string }
    ): Promise<SavedScript | null> => {
      const existing = scripts.find((s) => s.id === id);
      if (!existing) return null;
      const updated: SavedScript = {
        ...existing,
        title:
          input.title !== undefined
            ? input.title.trim() || existing.title
            : existing.title,
        content: input.content !== undefined ? input.content : existing.content,
        updatedAt: Date.now(),
      };
      const next = sortNewestFirst(
        scripts.map((s) => (s.id === id ? updated : s))
      );
      setScripts(next);
      await persist(next);
      return updated;
    },
    [scripts, persist]
  );

  const deleteScript = useCallback(
    async (id: string) => {
      const next = scripts.filter((s) => s.id !== id);
      setScripts(next);
      await persist(next);
    },
    [scripts, persist]
  );

  const getScript = useCallback(
    (id: string) => scripts.find((s) => s.id === id),
    [scripts]
  );

  const value = useMemo<SavedScriptsState>(
    () => ({
      scripts,
      loaded,
      saveScript,
      updateScript,
      deleteScript,
      getScript,
    }),
    [scripts, loaded, saveScript, updateScript, deleteScript, getScript]
  );

  return (
    <SavedScriptsContext.Provider value={value}>
      {children}
    </SavedScriptsContext.Provider>
  );
}

export function useSavedScripts() {
  const ctx = useContext(SavedScriptsContext);
  if (!ctx) {
    throw new Error(
      "useSavedScripts must be used within SavedScriptsProvider"
    );
  }
  return ctx;
}
