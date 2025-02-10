import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TTSInputForm from "./tts/TTSInputForm";
import TTSStatus from "./tts/TTSStatus";
import AudioPlayer from "./audioplayer/AudioPlayer";
import { useTTS } from "@/hooks/useTTS";

const TTSGenerator: React.FC = () => {
  const {
    isReady,
    isGenerating,
    error,
    generateSpeech,
    chunkProgress,
    mergedAudioUrl,
    generationStartTime,
    generationEndTime,
    audioBufferQueueRef,
    voices,
  } = useTTS();

  return (
    <div className="max-w-4xl mx-auto p-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center p-0">
            Text-to-Speech Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TTSInputForm
            onGenerate={generateSpeech}
            isReady={isReady}
            isGenerating={isGenerating}
            chunkProgress={chunkProgress}
            audioBufferQueueLength={audioBufferQueueRef.current.length}
            voices={voices} // Pass dynamic voices here
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

export default TTSGenerator;
