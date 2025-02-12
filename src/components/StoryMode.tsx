// StoryMode.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import StoryTTSInputForm from "../components/StoryTTS/StoryTTSInputForm";
import TTSStatus from "./tts/TTSStatus";
import AudioPlayer from "./audioplayer/AudioPlayer";
import { useStoryTTS, DialogEntry } from "@/hooks/useStoryTTS";
import { useTTSWorker } from "@/context/TTSWorkerContext";

const StoryMode: React.FC = () => {
  const { voices, isGenerating } = useTTSWorker();
  const {
    mergedAudioUrl,
    generationStartTime,
    generationEndTime,
    generateStory,
    error,
    chunkProgress,
    audioBufferQueueRef,
  } = useStoryTTS();

  // Local state for the JSON input and parsed dialogues.
  const [inputText, setInputText] = useState<string>("");
  const [dialogues, setDialogues] = useState<DialogEntry[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  // Mapping from character name to selected voice id.
  const [voiceMapping, setVoiceMapping] = useState<Record<string, string>>({});

  // Memoize unique characters so that the array only changes when dialogues change.
  const uniqueCharacters = useMemo(() => {
    return dialogues ? Array.from(new Set(dialogues.map((d) => d.character))) : [];
  }, [dialogues]);

  // Process the JSON text from the input.
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

  // When dialogues and voices are available, set default voice mapping for any new character.
  useEffect(() => {
    if (voices.length > 0 && dialogues) {
      setVoiceMapping((prevMapping) => {
        const newMapping = { ...prevMapping };
        uniqueCharacters.forEach((character) => {
          if (!newMapping[character]) {
            newMapping[character] = voices[0].id; // default to first available voice
          }
        });
        return newMapping;
      });
    }
  }, [voices, dialogues, uniqueCharacters]);

  // Update voice mapping when the user selects a different voice.
  const handleVoiceChange = (character: string, voiceId: string) => {
    setVoiceMapping((prev) => ({ ...prev, [character]: voiceId }));
  };

  // Handle the generation of the story TTS.
  const handleGenerate = async () => {
    if (!dialogues) return;
    try {
      await generateStory(dialogues, voiceMapping);
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Card>
        <CardContent className="space-y-4 p-4">
          <StoryTTSInputForm
            inputText={inputText}
            setInputText={setInputText}
            parseError={parseError}
            processText={processText}
            dialogues={dialogues}
            uniqueCharacters={uniqueCharacters}
            voiceMapping={voiceMapping}
            handleVoiceChange={handleVoiceChange}
            handleGenerate={handleGenerate}
            isGenerating={isGenerating}
            voices={voices}
          />

          <TTSStatus
            error={error}
            isGenerating={isGenerating}
            chunkProgress={chunkProgress}
            generationStartTime={generationStartTime}
            generationEndTime={generationEndTime}
          />

          {(mergedAudioUrl ||
            (audioBufferQueueRef.current && audioBufferQueueRef.current.length > 0)) && (
            <AudioPlayer
              mergedAudioUrl={mergedAudioUrl}
              audioBufferQueueRef={audioBufferQueueRef}
              isGenerating={isGenerating}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryMode;
