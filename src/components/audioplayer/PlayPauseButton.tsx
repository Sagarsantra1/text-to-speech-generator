import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";

interface PlayPauseButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isPaused: boolean;
}

const PlayPauseButton: React.FC<PlayPauseButtonProps> = ({
  onClick,
  disabled,
  isLoading,
  isPlaying,
  isPaused,
}) => {
  return (
    <div className="flex justify-center">
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="default"
        size="icon"
        className="p-6 rounded-full"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : !isPlaying && !isPaused ? (
          <Play />
        ) : isPlaying ? (
          <Pause />
        ) : (
          <Play />
        )}
      </Button>
    </div>
  );
};

export default PlayPauseButton;
