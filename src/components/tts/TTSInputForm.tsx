import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import VoiceSelector from "./VoiceSelector";
import { useToast } from "@/components/ui/use-toast";
import { useTTS } from "@/hooks/useTTS";

const TTSInputForm: React.FC = () => {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<string>("");

  // Get generation function and status from the context/hook
  const { generateSpeech, isReady, isGenerating, chunkProgress, audioBufferQueueRef } = useTTS();
  const { toast } = useToast();

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
    generateSpeech(text, voice);
  };

  const getButtonText = () => {
    if (!isReady && audioBufferQueueRef.current.length === 0) return "Initializing...";
    if (isGenerating) {
      if (chunkProgress.total > 0) {
        return `Generating Speech (Chunk ${chunkProgress.completed + 1}/${chunkProgress.total})...`;
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
