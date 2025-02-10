import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceSelector from "./VoiceSelector";
import { useToast } from "@/components/ui/use-toast";

// Define the Voice interface (or import it from a shared types file)
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "Male" | "Female";
  traits?: string;
  targetQuality: string;
  overallGrade: string;
}

interface TTSInputFormProps {
  onGenerate: (text: string, voice: string) => void;
  isReady: boolean;
  isGenerating: boolean;
  chunkProgress: { total: number; completed: number };
  audioBufferQueueLength: number;
  voices: Voice[];
}

const TTSInputForm: React.FC<TTSInputFormProps> = ({
  onGenerate,
  isReady,
  isGenerating,
  chunkProgress,
  audioBufferQueueLength,
  voices,
}) => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<string>(""); // now a generic string (voice id)
  const { toast } = useToast();

  // Set default voice once voices are available.
  useEffect(() => {
    if (!voice && voices.length > 0) {
      setVoice(voices[0].id);
    }
  }, [voices, voice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to convert to speech",
        variant: "destructive",
      });
      return;
    }
    onGenerate(text, voice);
  };

  const getButtonText = () => {
    if (!isReady && audioBufferQueueLength === 0) return "Initializing...";
    if (isGenerating) {
      if (chunkProgress.total > 0) {
        return `Generating Speech (Chunk ${chunkProgress.completed + 1}/${
          chunkProgress.total
        })...`;
      }
      return "Processing text...";
    }
    return "Generate Speech";
  };

  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type here to convert text to speech..."
        className="min-h-[40vh]"
      />
      <div className="flex items-center space-x-4 mt-2">
        <VoiceSelector
          voice={voice}
          voices={voices} // Pass the dynamic voices
          onVoiceChange={setVoice}
          disabled={!isReady || isGenerating}
        />
        <Button type="submit" disabled={!isReady || isGenerating}>
          {getButtonText()}
        </Button>
      </div>
    </form>
  );
};

export default TTSInputForm;
