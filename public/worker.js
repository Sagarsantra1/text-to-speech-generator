import { SentenceChunker } from "./SentenceChunker.js";
import { KokoroTTS } from "kokoro-js";

let tts = null;

/**
 * Initializes the TTS engine.
 * @returns {Promise<any>} A promise that resolves with the TTS instance.
 */
const initializeTTS = async () => {
  return await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-ONNX", {
    dtype: "q8",
    device: "wasm",
  });
};

/**
 * Uses SentenceChunker to split text into chunks.
 * @param {string} text - The text to split.
 * @returns {string[]} An array of text chunks.
 */
const getTextChunks = (text) => {
  const chunker = new SentenceChunker({ chunkLength: 300 });
  const chunks = [];
  chunker.onChunk((chunk) => chunks.push(chunk));
  chunker.push(text);
  chunker.flush();
  return chunks;
};

self.addEventListener("message", async (e) => {
  const { type } = e.data;

  if (type === "init") {
    try {
      tts = await initializeTTS();
      const voices = tts.voices;
      self.postMessage({ status: "ready", voices });
    } catch (error) {
      self.postMessage({ status: "error", error: error.message });
    }
    return;
  }

  if (type === "generate") {
    const { text, voice, requestId } = e.data;

    if (typeof text !== "string") {
      self.postMessage({
        status: "error",
        error: "Text must be a string.",
        requestId,
      });
      return;
    }

    try {
      // Split the text into chunks.
      const chunks = getTextChunks(text);
      self.postMessage({
        status: "chunk-start",
        totalChunks: chunks.length,
        requestId,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunkText = chunks[i];
        try {
          const audio = await tts.generate(chunkText, { voice });
          // Convert the generated audio into a Blob.
          const blob = audio.toBlob();
          self.postMessage({
            status: "chunk-complete",
            audio: blob,
            text: chunkText,
            chunkIndex: i,
            requestId,
          });
        } catch (error) {
          self.postMessage({
            status: "error",
            error: error.message,
            requestId,
          });
          return;
        }
      }
      self.postMessage({ status: "complete", requestId });
    } catch (error) {
      self.postMessage({
        status: "error",
        error: error.message,
        requestId,
      });
    }
  }
});
