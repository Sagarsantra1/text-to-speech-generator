import React from "react";
import { Card, CardContent, } from "@/components/ui/card";
import TTSInputForm from "./tts/TTSInputForm";
import TTSStatus from "./tts/TTSStatus";
import AudioPlayer from "./audioplayer/AudioPlayer";
import { useTTS } from "@/hooks/useTTS";

const TTSGenerator: React.FC = () => {
  const {
    isGenerating,
    error,
    chunkProgress,
    mergedAudioUrl,
    generationStartTime,
    generationEndTime,
    audioBufferQueueRef,
  } = useTTS();

  return (
    <div className="min-h-screen bg-background max-w-4xl mx-auto p-5">
      <Card >
        <CardContent className="space-y-4 p-4">
          <TTSInputForm/>

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

export default TTSGenerator;
