import React from "react";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/utils/formatTime";

interface SeekBarProps {
  playbackTime: number;
  totalDuration: number;
  onSeekStart: () => void;
  onSeekChange: (value: number) => void;
  onSeekEnd: () => void;
}

const SeekBar: React.FC<SeekBarProps> = ({
  playbackTime,
  totalDuration,
  onSeekStart,
  onSeekChange,
  onSeekEnd,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{formatTime(playbackTime)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
      <Slider
        value={[playbackTime]}
        min={0}
        max={totalDuration}
        step={0.01}
        onValueChange={(value) => onSeekChange(value[0])}
        onValueCommit={onSeekEnd}
        onPointerDown={onSeekStart}
        className="w-full"
      />
    </div>
  );
};

export default SeekBar;
