import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import VolumeControl from "./VolumeControl";
import OptionsMenu from "./OptionsMenu";
import SeekBar from "./SeekBar";
import PlayPauseButton from "./PlayPauseButton";
import useAudioPlayer from "@/hooks/useAudioPlayer";

interface AudioPlayerProps {
  mergedAudioUrl: string | null;
  audioBufferQueueRef: React.MutableRefObject<AudioBuffer[]>;
  isGenerating: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  mergedAudioUrl,
  audioBufferQueueRef,
  isGenerating,
}) => {
  const {
    isPlaying,
    isPaused,
    isLoading,
    playbackTime,
    totalDuration,
    offset,
    volume,
    setVolume,
    handlePlayPauseResume,
    handleSeekStart,
    handleSeekChange,
    handleSeekEnd,
  } = useAudioPlayer(audioBufferQueueRef, isGenerating);

  return (
    <Card className="mx-auto mb-5 shadow-lg py-2">
      <CardContent className="space-y-2 pb-2">
        {/* Top Controls */}
        <div className="flex justify-between items-center">
          <VolumeControl volume={volume} setVolume={setVolume} />
          <OptionsMenu mergedAudioUrl={mergedAudioUrl} />
        </div>

        {/* Seek Bar */}
        <SeekBar
          playbackTime={playbackTime}
          totalDuration={totalDuration}
          onSeekStart={handleSeekStart}
          onSeekChange={handleSeekChange}
          onSeekEnd={handleSeekEnd}
        />

        {/* Play/Pause/Loading Button */}
        <PlayPauseButton
          onClick={handlePlayPauseResume}
          disabled={totalDuration === 0}
          isLoading={isLoading}
          isPlaying={isPlaying}
          isPaused={isPaused}
        />
      </CardContent>
    </Card>
  );
};

export default AudioPlayer;
