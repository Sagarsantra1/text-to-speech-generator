import { useState, useEffect, useCallback, useRef } from "react";
import { concat } from "audio-buffer-utils";
import { encode } from "wav-encoder";
import { useTTSWorker } from "@/context/TTSWorkerContext";

/** A dialogue entry for TTS generation. */
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
 * It uses a worker (from context) to generate and decode audio,
 * merging the results into a single audio blob URL.
 */
export const useStoryTTS = () => {
  const [error, setError] = useState("");
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress>({
    total: 0,
    completed: 0,
  });
  const [mergedAudioUrl, setMergedAudioUrl] = useState<string | null>(null);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);
  const [generationEndTime, setGenerationEndTime] = useState<number | null>(null);

  const { worker, isReady, isGenerating } = useTTSWorker();

  // References for AudioContext and storing decoded AudioBuffers.
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferQueueRef = useRef<AudioBuffer[]>([]);

  // --- Worker Message Handlers ---

  const handleChunkStart = (data: any) => {
    console.log("handleChunkStart:", data);
    // (No longer updating progress or time here.)
  };

  const handleChunkComplete = async (data: any) => {
    console.log("handleChunkComplete:", data);
    try {
      // Decode the incoming audio blob into an AudioBuffer.
      const arrayBuffer = await data.audio.arrayBuffer();
      if (!audioContextRef.current) throw new Error("AudioContext not initialized");
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      audioBufferQueueRef.current.push(audioBuffer);
      // Merge the available audio buffers into one URL.
      mergeAndSetAudioUrl();
    } catch (err) {
      console.error("Error decoding audio chunk:", err);
      setError("Error decoding audio chunk");
    }
  };

  // Merge all stored AudioBuffers into a single WAV file and update state.
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
    } catch (err) {
      console.error("Error merging audio:", err);
      setError("Error merging audio");
    }
  };

  const handleComplete = async (data: any) => {
    console.log("handleComplete:", data);
    // (Set generationEndTime after all dialogues are processed.)
  };

  const handleWorkerError = (err: ErrorEvent) => {
    console.error("Worker encountered an error:", err);
    setError("Worker encountered an error");
  };

  const handleMessage = async (event: MessageEvent) => {
    const data = event.data;
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
    };
  }, [worker]);

  // Revoke the merged audio URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (mergedAudioUrl) {
        URL.revokeObjectURL(mergedAudioUrl);
      }
    };
  }, [mergedAudioUrl]);

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
        if (!append) {
          audioBufferQueueRef.current = [];
          if (mergedAudioUrl) {
            URL.revokeObjectURL(mergedAudioUrl);
            setMergedAudioUrl(null);
          }
        }
        // Generate a unique request ID.
        const requestId = Date.now().toString() + Math.random().toString();
        console.log("Posting generate message:", { requestId, text, voice });
        // Listen once for a matching response.
        const handleCompleteOnce = (event: MessageEvent) => {
          const data = event.data;
          if (data.requestId !== requestId) return;
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
      setChunkProgress({ total: dialogues.length, completed: 0 });
      
      for (let i = 0; i < dialogues.length; i++) {
        const dialogue = dialogues[i];
        const voiceId = voiceMapping[dialogue.character];
        if (!voiceId) continue;
        console.log("Generating dialogue:", dialogue, "with voice:", voiceId);
        try {
          // For the first dialogue, do not append; for subsequent ones, append.
          await generateSpeech(dialogue.dialog, voiceId, i > 0);
          setChunkProgress({ total: dialogues.length, completed: i + 1 });
        } catch (err) {
          console.error("Error generating speech for dialogue:", dialogue, err);
          setError(`Error generating speech for ${dialogue.character}`);
          break;
        }
      }
      setGenerationEndTime(Date.now());
    },
    [worker, generateSpeech]
  );

  return {
    isReady,
    isGenerating,
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
