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
 * Splits the provided text into chunks based on punctuation.
 * @param {string} text - The text to split.
 * @returns {string[]} An array of text chunks.
 */
const getTextChunks = (text) => {
  // Split text using a regular expression to match sentence boundaries.
  const sentences = text.split(
    /(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|!)\s/g
  );
  return sentences.filter((sentence) => sentence.trim() !== "");
};

self.addEventListener("message", async (e) => {
  const { type } = e.data;

  if (type === "init") {
    try {
      tts = await initializeTTS();
      const voices = tts.voices
      self.postMessage({ status: "ready", voices: voices });
    } catch (error) {
      self.postMessage({ status: "error", error: error.message });
    }
    return;
  }

  if (type === "generate") {
    const { text, voice } = e.data;

    if (typeof text !== "string") {
      self.postMessage({ status: "error", error: "Text must be a string." });
      return;
    }

    try {
      const chunks = getTextChunks(text);
      self.postMessage({ status: "chunk-start", totalChunks: chunks.length });

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
          });
        } catch (error) {
          self.postMessage({ status: "error", error: error.message });
          return;
        }
      }
      self.postMessage({ status: "complete" });
    } catch (error) {
      self.postMessage({ status: "error", error: error.message });
    }
  }
});
