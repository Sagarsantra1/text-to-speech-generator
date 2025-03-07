import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import VoiceSelector from "../tts/VoiceSelector";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DialogueManager, DialogueEntry } from "@/hooks/useDialogueManager";
import { Voice } from "@/context/TTSWorkerContext";

interface StoryTTSInputFormProps {
  dialogueManager: DialogueManager;
  handleGenerate: () => void;
  isGenerating: boolean;
  voices: Voice[];
}

/** Renders the collapsible JSON input section. */
const DialogueInputSection: React.FC<{
  inputText: string;
  setInputText: (text: string) => void;
  parseError: string | null;
  processText: () => void;
  dialogues: DialogueEntry[] | null;
}> = ({ inputText, setInputText, parseError, processText, dialogues }) => {
  const [open, setOpen] = React.useState(dialogues === null);

  React.useEffect(() => {
    setOpen(Boolean(!dialogues));
  }, [dialogues]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between cursor-pointer"
        aria-expanded={open}
      >
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
  );
};

/** Renders the voice selection section for each unique character. */
const VoiceSelectionSection: React.FC<{
  uniqueCharacters: string[];
  voiceMapping: Record<string, string>;
  handleVoiceChange: (character: string, voiceId: string) => void;
  isGenerating: boolean;
  voices: Voice[];
}> = ({
  uniqueCharacters,
  voiceMapping,
  handleVoiceChange,
  isGenerating,
  voices,
}) => {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Voice Selection</h2>
      <div className="flex items-center justify-between w-full flex-wrap">
        {uniqueCharacters.map((character) => (
          <div key={character} className="mb-2 flex items-center space-x-3">
            <label className="font-medium w-20">{character}:</label>
            <VoiceSelector
              voice={voiceMapping[character]}
              onVoiceChange={(voiceId) => handleVoiceChange(character, voiceId)}
              disabled={isGenerating}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

/** Renders the list of processed dialogues. */
const DialogueListSection: React.FC<{ dialogues: DialogueEntry[] }> = ({
  dialogues,
}) => {
  return (
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
  );
};

/** Renders the generate audio button. */
const GenerateAudioButton: React.FC<{
  handleGenerate: () => void;
  isGenerating: boolean;
}> = ({ handleGenerate, isGenerating }) => {
  return (
    <div className="flex justify-center items-center">
      <Button onClick={handleGenerate} disabled={isGenerating} className="mb-2">
        {isGenerating ? "Generating Audio..." : "Generate Audio"}
      </Button>
    </div>
  );
};

/** Main input form component that combines all sections. */
const StoryTTSInputForm: React.FC<StoryTTSInputFormProps> = ({
  dialogueManager,
  handleGenerate,
  isGenerating,
  voices,
}) => {
  const {
    inputText,
    setInputText,
    parseError,
    processText,
    dialogues,
    uniqueCharacters,
    voiceMapping,
    handleVoiceChange,
  } = dialogueManager;

  return (
    <div className="space-y-4">
      <DialogueInputSection
        inputText={inputText}
        setInputText={setInputText}
        parseError={parseError}
        processText={processText}
        dialogues={dialogues}
      />

      {dialogues && (
        <>
          <VoiceSelectionSection
            uniqueCharacters={uniqueCharacters}
            voiceMapping={voiceMapping}
            handleVoiceChange={handleVoiceChange}
            isGenerating={isGenerating}
            voices={voices}
          />

          <DialogueListSection dialogues={dialogues} />

          <GenerateAudioButton
            handleGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </>
      )}
    </div>
  );
};

export default StoryTTSInputForm;
