import { useState, useMemo, useEffect } from "react";
import { Voice } from "@/context/TTSWorkerContext";

/** A dialogue entry consists of a character name and the text to speak. */
export interface DialogueEntry {
  character: string;
  dialog: string;
}

/** The custom hook’s return type. */
export interface DialogueManager {
  inputText: string;
  setInputText: (text: string) => void;
  dialogues: DialogueEntry[] | null;
  parseError: string | null;
  processText: () => void;
  uniqueCharacters: string[];
  voiceMapping: Record<string, string>;
  handleVoiceChange: (character: string, voiceId: string) => void;
}

/**
 * Custom hook to manage dialogue input state, JSON parsing, and voice mapping.
 * @param voices – Available voices (from the TTS worker) used to set defaults.
 */
const useDialogueManager = (voices: Voice[]): DialogueManager => {
  const [inputText, setInputText] = useState<string>("");
  const [dialogues, setDialogues] = useState<DialogueEntry[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [voiceMapping, setVoiceMapping] = useState<Record<string, string>>({});

  const processText = () => {
    try {
      const parsed = JSON.parse(inputText);
      if (!Array.isArray(parsed)) {
        throw new Error("Input must be an array of dialogue objects.");
      }
      // Validate each dialogue entry.
      for (const entry of parsed) {
        if (
          typeof entry !== "object" ||
          typeof entry.character !== "string" ||
          typeof entry.dialog !== "string"
        ) {
          throw new Error(
            "Each dialogue must be an object with 'character' and 'dialog' string keys."
          );
        }
      }
      setDialogues(parsed);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || "Error parsing JSON input.");
      setDialogues(null);
    }
  };

  // Derive the list of unique character names.
  const uniqueCharacters = useMemo(() => {
    return dialogues ? Array.from(new Set(dialogues.map((d) => d.character))) : [];
  }, [dialogues]);

  const handleVoiceChange = (character: string, voiceId: string) => {
    setVoiceMapping((prev) => ({ ...prev, [character]: voiceId }));
  };

  // Set default voice mapping when dialogues become available and voices are loaded.
  useEffect(() => {
    if (voices.length > 0 && dialogues) {
      setVoiceMapping((prevMapping) => {
        const newMapping = { ...prevMapping };
        uniqueCharacters.forEach((character) => {
          if (!newMapping[character]) {
            newMapping[character] = voices[0].id; // default to the first available voice
          }
        });
        return newMapping;
      });
    }
  }, [voices, dialogues, uniqueCharacters]);

  return {
    inputText,
    setInputText,
    dialogues,
    parseError,
    processText,
    uniqueCharacters,
    voiceMapping,
    handleVoiceChange,
  };
};

export default useDialogueManager;
