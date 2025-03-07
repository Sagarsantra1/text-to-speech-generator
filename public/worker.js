import { KokoroTTS, TextSplitterStream } from "kokoro-js";

let tts = null;
const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";

/**
 * Initializes the TTS engine with the provided device.
 * @param {string} device - "webgpu" or "wasm"
 * @returns {Promise<any>}
 */
const initializeTTS = async (device) => {
  return await KokoroTTS.from_pretrained(model_id, {
    dtype: "fp32",
    device,
  });
};

self.addEventListener("message", async (e) => {
  const { type } = e.data;

  if (type === "init" || type === "reinit") {
    const { device } = e.data;
    try {
      tts = await initializeTTS(device);
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
      const splitter = new TextSplitterStream();
      const stream = tts.stream(splitter, { voice });

      self.postMessage({ status: "stream-start", requestId });

      // Tokenize the text and push tokens into the splitter with a slight delay.
      const tokens = text.match(/\s*\S+/g) || [text];
      for (const token of tokens) {
        splitter.push(token);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      splitter.close();

      let chunkIndex = 0;
      for await (const { text: , phonemes, audio } of stream) {
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
