import { useState, useEffect, useCallback, useRef } from "react";
import { concat } from "audio-buffer-utils";
import { encode } from "wav-encoder";

// Define the different statuses our generation process can have.
export type GenerationStatus =
  | "init"
  | "ready"
  | "loading"
  | "chunking"
  | "generating"
  | "error";

interface ChunkProgress {
  total: number;
  completed: number;
}
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "Male" | "Female";
  traits?: string;
  targetQuality: string;
  overallGrade: string;
}

/**
 * Custom hook for Text-to-Speech generation.
 */
export const useTTS = () => {
  // State Variables
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>("init");
  const [error, setError] = useState("");
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    total: 0,
    completed: 0,
  });
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null
  );
  const [generationEndTime, setGenerationEndTime] = useState<number | null>(
    null
  );
  const [voices, setVoices] = useState<Voice[]>([]);

  // References
  const workerRef = useRef<Worker | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // Holds the decoded AudioBuffers.
  const audioBufferQueueRef = useRef<AudioBuffer[]>([]);

  // Derived Values
  const isReady = generationStatus !== "init";
  const isGenerating = ["loading", "chunking", "generating"].includes(
    generationStatus
  );

  // Worker Message Handlers

  const handleReady = (data: any) => {
    setGenerationStatus("ready");

    // Convert the voices object into an array of Voice objects.
    const voicesArray: Voice[] = Object.entries(data.voices).map(
      ([id, voiceData]) => ({
        id,
        ...(voiceData as Omit<Voice, "id">),
      })
    );

    setVoices(voicesArray);
  };

  const handleChunkStart = (data: any) => {
    setChunkProgress({ total: data.totalChunks, completed: 0 });
    setGenerationStatus("chunking");
    // Clear any previous buffers.
    audioBufferQueueRef.current = [];
    setGenerationStartTime(Date.now());
    setGenerationEndTime(null);
  };

  const handleChunkComplete = async (data: any) => {
    try {
      // Decode the incoming audio blob into an AudioBuffer.
      const arrayBuffer = await data.audio.arrayBuffer();
      const audioBuffer = await audioContextRef.current!.decodeAudioData(
        arrayBuffer
      );
      audioBufferQueueRef.current.push(audioBuffer);
      setChunkProgress((prev) => ({
        total: prev.total,
        completed: prev.completed + 1,
      }));
    } catch (err) {
      console.error("Error decoding audio chunk:", err);
      setError("Error decoding audio chunk");
      setGenerationStatus("error");
    }
  };

  const handleComplete = async () => {
    try {
      // Merge all audio buffers.
      const mergedBuffer = concat(...audioBufferQueueRef.current);
      const wavData = await encode({
        sampleRate: mergedBuffer.sampleRate,
        channelData: Array.from(
          { length: mergedBuffer.numberOfChannels },
          (_, i) => mergedBuffer.getChannelData(i)
        ),
      });
      const wavBlob = new Blob([wavData], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      setMergedAudioUrl(url);
      setGenerationEndTime(Date.now());
      setGenerationStatus("ready");
    } catch (err) {
      console.error("Error merging audio:", err);
      setError("Error merging audio");
      setGenerationStatus("error");
    }
  };

  const handleWorkerError = (err: ErrorEvent) => {
    console.error("Worker encountered an error:", err);
    setError("Worker encountered an error");
    setGenerationStatus("error");
  };

  // Main message handler that delegates based on status.
  const handleMessage = async (event: MessageEvent) => {
    const data = event.data;
    switch (data.status) {
      case "ready":
        handleReady(data);
        break;
      case "chunk-start":
        handleChunkStart(data);
        break;
      case "chunk-complete":
        await handleChunkComplete(data);
        break;
      case "complete":
        await handleComplete();
        break;
      case "error":
        console.error("Worker error reported:", data.error);
        setError(data.error || "Unknown error");
        setGenerationStatus("error");
        break;
      default:
        console.warn("Unhandled worker message:", data);
    }
  };

  // Worker and AudioContext Initialization
  useEffect(() => {
    try {
      // Create a new worker from our dedicated file.
      workerRef.current = new Worker(new URL("/worker.js", import.meta.url), {
        type: "module",
      });
      // Initialize an AudioContext to decode incoming audio data.
      audioContextRef.current = new AudioContext();
    } catch (err) {
      console.error("Initialization failed:", err);
      setError("Failed to initialize audio engine");
      setGenerationStatus("error");
      return;
    }

    workerRef.current.addEventListener("message", handleMessage);
    workerRef.current.addEventListener("error", handleWorkerError);
    workerRef.current.postMessage({ type: "init" });

    return () => {
      // Cleanup worker and audio context on unmount.
      workerRef.current?.terminate();
      audioContextRef.current?.close();
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
      }
    };
    // We intentionally leave the dependency array empty so this effect runs only once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Speech Generation Function
  const generateSpeech = useCallback(
    (text: string, voice: string) => {
      if (!workerRef.current) {
        console.warn("Worker is not initialized.");
        return;
      }
      // Clear previous buffers and merged audio.
      audioBufferQueueRef.current = [];
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
        setMergedAudioUrl(null);
      }
      setGenerationStatus("loading");
      workerRef.current.postMessage({ type: "generate", text, voice });
    },
    [mergedAudioUrl]
  );

  // Return only the necessary properties and functions.
  return {
    isReady,
    error,
    chunkProgress,
    generationStartTime,
    generationEndTime,
    generateSpeech,
    isGenerating,
    mergedAudioUrl,
    audioBufferQueueRef,
    voices,
  };
};
