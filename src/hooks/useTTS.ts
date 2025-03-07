import { useState, useEffect, useCallback, useRef } from "react";
import { concat } from "audio-buffer-utils";
import { encode } from "wav-encoder";
import { useTTSWorker } from "@/context/TTSWorkerContext";

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

/**
 * Custom hook for Text-to-Speech generation.
 */
export const useTTS = () => {
  // Local state for error, chunk progress, and merged audio.
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

  // Get worker and status values from context.
  const { worker, isReady, isGenerating } = useTTSWorker();

  // References for AudioContext and audio buffers.
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferQueueRef = useRef<AudioBuffer[]>([]);

  // Worker message handlers for generation.
  const handleChunkStart = (data: any) => {
    // Use data.totalChunks if provided; default to 0 if not.
    setChunkProgress({ total: data.totalChunks || 0, completed: 0 });
    // Clear any previous buffers.
    audioBufferQueueRef.current = [];
    setGenerationStartTime(Date.now());
    setGenerationEndTime(null);
    setMergedAudioUrl(null);
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
      mergeAndSetAudioUrl();
    } catch (err) {
      console.error("Error decoding audio chunk:", err);
      setError("Error decoding audio chunk");
    }
  };

  const mergeAndSetAudioUrl = async () => {
    try {
      if (audioBufferQueueRef.current.length === 0) {
        console.error("No audio buffers found. Aborting merge.");
        return;
      }
      // Merge all audio buffers.
      const mergedBuffer = concat(...audioBufferQueueRef.current);
      // Encode the merged buffer into WAV format.
      const wavData = await encode({
        sampleRate: mergedBuffer.sampleRate,
        channelData: Array.from(
          { length: mergedBuffer.numberOfChannels },
          (_, i) => mergedBuffer.getChannelData(i)
        ),
      });
      // Create a Blob from the WAV data and generate a URL.
      const wavBlob = new Blob([wavData], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      setMergedAudioUrl(url);
      setGenerationEndTime(Date.now());
    } catch (err) {
      console.error("Error merging audio:", err);
      setError("Error merging audio");
    }
  };

  const handleComplete = async () => {
    setGenerationEndTime(Date.now());
  };

  const handleWorkerError = (err: ErrorEvent) => {
    console.error("Worker encountered an error:", err);
    setError("Worker encountered an error");
  };

  const handleMessage = async (event: MessageEvent) => {
    const data = event.data;
    switch (data.status) {
      case "stream-start":
        // Treat the new "stream-start" as the start of generation.
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
        break;
      default:
        console.warn("Unhandled worker message:", data);
    }
  };

  useEffect(() => {
    if (!worker) return;

    try {
      // Initialize an AudioContext to decode incoming audio data.
      audioContextRef.current = new AudioContext();
    } catch (err) {
      console.error("AudioContext initialization failed:", err);
      setError("Failed to initialize audio engine");
      return;
    }

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleWorkerError);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleWorkerError);
      audioContextRef.current?.close();
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
      }
    };
  }, [worker, mergedAudioUrl]);

  // Speech generation function.
  const generateSpeech = useCallback(
    (text: string, voice: string) => {
      if (!worker) {
        console.warn("Worker is not initialized.");
        return;
      }
      // Clear previous buffers and merged audio.
      audioBufferQueueRef.current = [];
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
        setMergedAudioUrl(null);
      }
      // Generate a requestId for tracking.
      const requestId = Date.now();
      voice;
      worker.postMessage({ type: "generate", text, voice, requestId });
    },
    [worker, mergedAudioUrl]
  );

  return {
    isReady, // from context
    isGenerating, // from context
    error,
    chunkProgress,
    generationStartTime,
    generationEndTime,
    generateSpeech,
    mergedAudioUrl,
    audioBufferQueueRef,
  };
};
