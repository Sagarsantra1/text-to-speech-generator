import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { toast } from "sonner";

// Define your Voice interface (adjust as needed)
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "Male" | "Female";
  traits?: string;
  targetQuality: string;
  overallGrade: string;
}

// Extend the context to include device state.
interface TTSContextValue {
  worker: Worker | null;
  voices: Voice[];
  isReady: boolean;
  isGenerating: boolean;
  device: string;
  setDevice: (device: string) => void;
}

const TTSContext = createContext<TTSContextValue>({
  worker: null,
  voices: [],
  isReady: false,
  isGenerating: false,
  device: "wasm",
  setDevice: () => {},
});

export const TTSWorkerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [device, setDevice] = useState("wasm");

  // Memoized message handler to avoid re-creation on every render.
  const handleMessage = useCallback((event: MessageEvent) => {
    const data = event.data;
    switch (data.status) {
      case "ready":
        setIsReady(true);
        if (data.voices) {
          const voicesArray = Object.entries(data.voices).map(
            ([id, voiceData]) => ({
              id,
              ...(voiceData as Omit<Voice, "id">),
            })
          );
          setVoices(voicesArray);
        }
        break;
      case "stream-start":
        setIsGenerating(true);
        break;
      case "complete":
      case "error":
        setIsGenerating(false);
        break;
      default:
        break;
    }
  }, []);

  // Initialize the worker on mount.
  useEffect(() => {
    const newWorker = new Worker(
      new URL("/worker.js", import.meta.url),
      { type: "module" }
    );
    setWorker(newWorker);
    newWorker.addEventListener("message", handleMessage);

    // Load device setting from localStorage or default to "wasm"
    const savedDevice = localStorage.getItem("device") || "wasm";
    setDevice(savedDevice);
    newWorker.postMessage({ type: "init", device: savedDevice });
    toast(`Device set to: ${savedDevice}`);

    return () => {
      newWorker.removeEventListener("message", handleMessage);
      newWorker.terminate();
    };
  }, [handleMessage]);

  // Update localStorage and notify the worker when the device changes.
  useEffect(() => {
    if (worker) {
      localStorage.setItem("device", device);
      worker.postMessage({ type: "reinit", device });
      toast(`Device changed to: ${device}`);
    }
  }, [device, worker]);

  // Memoize the context value to avoid unnecessary re-renders.
  const contextValue = useMemo(
    () => ({
      worker,
      voices,
      isReady,
      isGenerating,
      device,
      setDevice,
    }),
    [worker, voices, isReady, isGenerating, device]
  );

  return (
    <TTSContext.Provider value={contextValue}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTSWorker = () => useContext(TTSContext);
