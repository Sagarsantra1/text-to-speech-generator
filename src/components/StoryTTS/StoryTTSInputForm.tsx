// StoryTTSInputForm.tsx
import React, { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import VoiceSelector from "../tts/VoiceSelector";
import { DialogEntry } from "@/hooks/useStoryTTS";
import { Voice } from "@/context/TTSWorkerContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface StoryTTSInputFormProps {
  inputText: string;
  setInputText: (text: string) => void;
  parseError: string | null;
  processText: () => void;
  dialogues: DialogEntry[] | null;
  uniqueCharacters: string[];
  voiceMapping: Record<string, string>;
  handleVoiceChange: (character: string, voiceId: string) => void;
  handleGenerate: () => void;
  isGenerating: boolean;
  voices: Voice[];
}

const StoryTTSInputForm: React.FC<StoryTTSInputFormProps> = ({
  inputText,
  setInputText,
  parseError,
  processText,
  dialogues,
  uniqueCharacters,
  voiceMapping,
  handleVoiceChange,
  handleGenerate,
  isGenerating,
}) => {
  // Show the "Enter Dialogues" section open if no dialogues exist.
  const [enterDialoguesOpen, setEnterDialoguesOpen] = useState(
    dialogues === null
  );

  useEffect(() => {
    // When dialogues are present, collapse the input section.
    if (dialogues) {
      setEnterDialoguesOpen(false);
    } else {
      setEnterDialoguesOpen(true);
    }
  }, [dialogues]);

  return (
    <div className="space-y-4">
      {/* --- Step 1: Enter Dialogues (Collapsible) --- */}
      <Collapsible
        open={enterDialoguesOpen}
        onOpenChange={setEnterDialoguesOpen}
      >
        <CollapsibleTrigger className="flex w-full items-center justify-between cursor-pointer">
          <span className="text-xl font-semibold">Enter Dialogues (JSON)</span>
          <ChevronDown className="h-5 w-5 transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea
            className="w-full h-40 mt-2 mb-2"
            placeholder='[{"character": "Narrator", "dialog": "The old house stood silent and still."}, {"character": "David", "dialog": "Hello?"}]'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          {parseError && (
            <p className="text-red-500 text-sm mb-2">{parseError}</p>
          )}
          <div className="flex justify-center">
            <Button onClick={processText}>Process Text</Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* --- Step 2: Voice Selection & Display Dialogues --- */}
      {dialogues && (
        <>
          <section>
            <h2 className="text-xl font-semibold mb-2">Voice Selection</h2>
            <div className="flex items-center justify-between w-full flex-wrap">
              {uniqueCharacters.map((character) => (
                <div
                  key={character}
                  className="mb-3 flex items-center space-x-3"
                >
                  <label className="font-medium w-20">{character}:</label>
                  <VoiceSelector
                    voice={voiceMapping[character]}
                    onVoiceChange={(voiceId) =>
                      handleVoiceChange(character, voiceId)
                    }
                    disabled={isGenerating}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Dialogues</h2>
            <ul className="list-disc pl-6 max-h-56 overflow-y-scroll">
              {dialogues.map((dialogue, index) => (
                <li key={index}>
                  <span className="font-medium">{dialogue.character}:</span>{" "}
                  {dialogue.dialog}
                </li>
              ))}
            </ul>
          </section>
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="mb-4"
            >
              {isGenerating ? "Generating Audio..." : "Generate Audio"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StoryTTSInputForm;
