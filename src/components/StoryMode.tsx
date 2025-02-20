import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import StoryTTSInputForm from "@/components/StoryTTS/StoryTTSInputForm";
import TTSStatus from "./tts/TTSStatus";
import AudioPlayer from "./audioplayer/AudioPlayer";
import { useStoryTTS } from "@/hooks/useStoryTTS";
import { useTTSWorker } from "@/context/TTSWorkerContext";
import useDialogueManager from "@/hooks/useDialogueManager";

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

  // Use the custom dialogue manager hook.
  const dialogueManager = useDialogueManager(voices);

  // Handle generating the story from dialogues.
  const handleGenerate = async () => {
    if (!dialogueManager.dialogues) return;
    try {
      await generateStory(dialogueManager.dialogues, dialogueManager.voiceMapping);
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  return (
    <div >
      <Card>
        <CardContent className="space-y-4 p-4">
          <StoryTTSInputForm
            dialogueManager={dialogueManager}
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

          {(mergedAudioUrl || audioBufferQueueRef.current.length > 0) && (
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
