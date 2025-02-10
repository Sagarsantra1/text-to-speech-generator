import { encoding_for_model } from "@dqbd/tiktoken";

const tokenizer = encoding_for_model("gpt2");

export const chunkText = (text: string, maxTokens: number = 512): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  console.log("Starting text chunking process");

  for (const sentence of sentences) {
    const potentialChunk = currentChunk + sentence;
    const tokens = tokenizer.encode(potentialChunk);

    console.log(`Current sentence tokens: ${tokens.length}`);

    if (tokens.length > maxTokens) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        // If a single sentence is too long, split it by words
        const words = sentence.split(" ");
        let wordChunk = "";
        
        for (const word of words) {
          const potentialWordChunk = wordChunk + " " + word;
          const wordTokens = tokenizer.encode(potentialWordChunk);
          
          if (wordTokens.length > maxTokens) {
            if (wordChunk) chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk = potentialWordChunk;
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      }
    } else {
      currentChunk = potentialChunk;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  console.log(`Generated ${chunks.length} chunks`);
  return chunks;
};
