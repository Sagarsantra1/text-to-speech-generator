import React, { createContext, useContext, useEffect, useState } from "react";

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

// Define the context value shape, including worker status.
interface TTSContextValue {
  worker: Worker | null;
  voices: Voice[];
  isReady: boolean;
  isGenerating: boolean;
}

const TTSContext = createContext<TTSContextValue>({
  worker: null,
  voices: [],
  isReady: false,
  isGenerating: false,
});

export const TTSWorkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Create the worker only once when the provider mounts.
    const newWorker = new Worker(new URL("/worker.js", import.meta.url), { type: "module" });
    setWorker(newWorker);

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      switch (data.status) {
        case "ready":
          setIsReady(true);
          // Convert the voices object into an array of Voice objects.
          if (data.voices) {
            const voicesArray: Voice[] = Object.entries(data.voices).map(
              ([id, voiceData]) => ({
                id,
                ...(voiceData as Omit<Voice, "id">),
              })
            );
            setVoices(voicesArray);
          }
          break;
        case "stream-start":
          // New worker status indicating generation has started.
          setIsGenerating(true);
          break;
        case "complete":
        case "error":
          setIsGenerating(false);
          break;
        default:
          break;
      }
    };

    newWorker.addEventListener("message", handleMessage);
    // Initialize the worker.
    newWorker.postMessage({ type: "init" });

    return () => {
      newWorker.removeEventListener("message", handleMessage);
      newWorker.terminate();
    };
  }, []);

  return (
    <TTSContext.Provider value={{ worker, voices, isReady, isGenerating }}>
      {children}
    </TTSContext.Provider>
  );
};

export const useTTSWorker = () => useContext(TTSContext);
