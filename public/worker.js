
import { KokoroTTS, TextSplitterStream } from "kokoro-js";

/**
 * Checks if WebGPU is available.
 * @returns {Promise<boolean>} A promise that resolves to true if WebGPU is available.
 */
async function detectWebGPU() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

let tts = null;
const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";

/**
 * Initializes the TTS engine with either WebGPU (if available) or WASM.
 * @returns {Promise<any>} A promise that resolves with the TTS instance.
 */
const initializeTTS = async () => {
  const hasWebGPU = await detectWebGPU();
  const device = hasWebGPU ? "webgpu" : "wasm";
  return await KokoroTTS.from_pretrained(model_id, {
    dtype: "fp32", // Using fp32 for higher precision.
    device,
  });
};

self.addEventListener("message", async (e) => {
  const { type } = e.data;

  if (type === "init") {
    try {
      tts = await initializeTTS();
      self.postMessage({ status: "ready", voices: tts.voices });
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
      // Create a new TextSplitterStream for streaming text input.
      const splitter = new TextSplitterStream();
      // Create a stream from the TTS engine.
      const stream = tts.stream(splitter,{ voice });

      // Instead of calling tts.setVoice (which does not exist),
      // pass the voice option to each generation call.
      // This allows the engine to use the specified voice.
      // Example: tts.generate(chunkText, { voice })

      // Inform the client that streaming is starting.
      self.postMessage({ status: "stream-start", requestId });

      // Split the text into tokens (words) and push them into the stream.
      const tokens = text.match(/\s*\S+/g) || [text];
      for (const token of tokens) {
        splitter.push(token);
        // Mimic streaming input with a short delay.
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      // Signal that no more text will be added.
      splitter.close();

      let chunkIndex = 0;
      for await (const { text: chunkText, phonemes, audio } of stream) {
        // Pass the voice option if needed when generating audio.
        // (In this design, voice is assumed to be handled during generation.)
        const blob = audio.toBlob ? audio.toBlob() : audio;
        self.postMessage({
          status: "chunk-complete",
          audio: blob,
          text: chunkText,
          chunkIndex,
          requestId,
        });
        chunkIndex++;
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
