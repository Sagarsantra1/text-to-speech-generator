// useStoryTTS.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { concat } from "audio-buffer-utils";
import { encode } from "wav-encoder";
import { useTTSWorker } from "@/context/TTSWorkerContext";

// Define the type for a dialogue entry.
export interface DialogEntry {
  character: string;
  dialog: string;
}

interface ChunkProgress {
  total: number;
  completed: number;
}

/**
 * Custom hook for generating TTS for a multi–dialogue “story.”
 * It uses a worker (from context) to generate and decode audio, merging
 * the results into a single audio blob URL.
 */
export const useStoryTTS = () => {
  // Local state for error, progress, and audio URL.
  const [error, setError] = useState("");
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    total: 0,
    completed: 0,
  });
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [generationEndTime, setGenerationEndTime] = useState<number | null>(null);

  // Get the worker and status values from context.
  const { worker, isReady, isGenerating } = useTTSWorker();

  // References for AudioContext and to store decoded AudioBuffers.
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferQueueRef = useRef<AudioBuffer[]>([]);

  // --- Worker Message Handlers ---

  // Called when a new generation begins.
  const handleChunkStart = (data: any) => {
    console.log("handleChunkStart:", data);
    setChunkProgress({ total: data.totalChunks, completed: 0 });
    // (For a new dialogue, buffers will be cleared in generateSpeech if not appending.)
    setGenerationStartTime(Date.now());
    setGenerationEndTime(null);
  };

  // Called when a chunk is generated.
  const handleChunkComplete = async (data: any) => {
    console.log("handleChunkComplete:", data);
    try {
      // Decode the incoming audio blob into an AudioBuffer.
      const arrayBuffer = await data.audio.arrayBuffer();
      if (!audioContextRef.current) throw new Error("AudioContext not initialized");
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferQueueRef.current.push(audioBuffer);
      setChunkProgress((prev) => ({
        total: prev.total,
        completed: prev.completed + 1,
      }));
      // Merge the available audio buffers into one URL.
      mergeAndSetAudioUrl();
    } catch (err) {
      console.error("Error decoding audio chunk:", err);
      setError("Error decoding audio chunk");
    }
  };

  // Merges all stored AudioBuffers into a single WAV file and updates state.
  const mergeAndSetAudioUrl = async () => {
    try {
      if (audioBufferQueueRef.current.length === 0) {
        console.error("No audio buffers found. Aborting merge.");
        return;
      }
      // Concatenate all audio buffers.
      const mergedBuffer = concat(...audioBufferQueueRef.current);
      // Encode the merged buffer into WAV format.
      const wavData = await encode({
        sampleRate: mergedBuffer.sampleRate,
        channelData: Array.from(
          { length: mergedBuffer.numberOfChannels },
          (_, i) => mergedBuffer.getChannelData(i)
        ),
      });
      // Create a Blob and generate an object URL.
      const wavBlob = new Blob([wavData], { type: "audio/wav" });
      const url = URL.createObjectURL(wavBlob);
      setMergedAudioUrl(url);
      setGenerationEndTime(Date.now());
    } catch (err) {
      console.error("Error merging audio:", err);
      setError("Error merging audio");
    }
  };

  // Called when the worker signals the overall generation is complete.
  const handleComplete = async (data: any) => {
    console.log("handleComplete:", data);
    setGenerationEndTime(Date.now());
  };

  // Called when the worker encounters an error.
  const handleWorkerError = (err: ErrorEvent) => {
    console.error("Worker encountered an error:", err);
    setError("Worker encountered an error");
  };

  // Global worker message handler.
  const handleMessage = async (event: MessageEvent) => {
    const data = event.data;
    // (This global handler will log all messages coming from the worker.)
    console.log("Global worker message:", data);
    switch (data.status) {
      case "chunk-start":
        handleChunkStart(data);
        break;
      case "chunk-complete":
        await handleChunkComplete(data);
        break;
      case "complete":
        await handleComplete(data);
        break;
      case "error":
        console.error("Worker error reported:", data.error);
        setError(data.error || "Unknown error");
        break;
      default:
        console.warn("Unhandled worker message:", data);
    }
  };

  // --- Setup & Cleanup ---
  useEffect(() => {
    if (!worker) return;

    try {
      // Create an AudioContext for decoding audio data.
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

  // --- Generation Functions ---

  /**
   * Generate speech for a single text block using the provided voice.
   * The `append` flag determines whether to clear previous buffers (if false)
   * or to append to them (if true).
   */
  const generateSpeech = useCallback(
    (text: string, voice: string, append: boolean = false) => {
      return new Promise<void>((resolve, reject) => {
        if (!worker) {
          reject("Worker not initialized");
          return;
        }
        // If this is not an appended dialogue, clear previous buffers and URL.
        if (!append) {
          audioBufferQueueRef.current = [];
          if (mergedAudioUrl) {
            URL.revokeObjectURL(mergedAudioUrl);
            setMergedAudioUrl(null);
          }
        }
        // Generate a unique request ID so we can track responses.
        const requestId = Date.now().toString() + Math.random().toString();
        console.log("Posting generate message:", { requestId, text, voice });
        // Attach a one–time listener that only resolves messages matching this request.
        const handleCompleteOnce = (event: MessageEvent) => {
          const data = event.data;
          if (data.requestId !== requestId) return; // Ignore messages from other requests.
          if (data.status === "complete") {
            console.log("Received complete for request:", requestId);
            worker.removeEventListener("message", handleCompleteOnce);
            resolve();
          } else if (data.status === "error") {
            console.error("Received error for request:", requestId, data.error);
            worker.removeEventListener("message", handleCompleteOnce);
            reject(data.error);
          }
        };
        worker.addEventListener("message", handleCompleteOnce);
        // Post the generation request with the unique requestId.
        worker.postMessage({ type: "generate", text, voice, requestId });
      });
    },
    [worker, mergedAudioUrl]
  );

  /**
   * Processes an array of dialogues sequentially.
   * @param dialogues Array of dialogues to process.
   * @param voiceMapping Record mapping each character to a voice id.
   */
  const generateStory = useCallback(
    async (dialogues: DialogEntry[], voiceMapping: Record<string, string>) => {
      if (!worker) {
        throw new Error("Worker not initialized");
      }
      setGenerationStartTime(Date.now());
      setGenerationEndTime(null);
      // Process each dialogue sequentially.
      for (let i = 0; i < dialogues.length; i++) {
        const dialogue = dialogues[i];
        const voiceId = voiceMapping[dialogue.character];
        if (!voiceId) continue; // Skip if no voice was selected.
        console.log("Generating dialogue:", dialogue, "with voice:", voiceId);
        try {
          // For the first dialogue, do not append; for subsequent ones, append.
          await generateSpeech(dialogue.dialog, voiceId, i > 0);
        } catch (err) {
          console.error("Error generating speech for dialogue:", dialogue, err);
          setError(`Error generating speech for ${dialogue.character}`);
          break;
        }
      }
    },
    [worker, generateSpeech]
  );

  return {
    isReady, // from context
    isGenerating, // from context
    error,
    chunkProgress,
    generationStartTime,
    generationEndTime,
    generateSpeech,
    generateStory,
    mergedAudioUrl,
    audioBufferQueueRef,
  };
};
