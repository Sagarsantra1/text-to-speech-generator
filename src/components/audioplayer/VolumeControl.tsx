import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume, Volume2, VolumeX } from "lucide-react";

interface VolumeControlProps {
  volume: number;
  setVolume: (value: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ volume, setVolume }) => {
  const renderVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeX className="w-6 h-6" />;
    } else if (volume < 0.5) {
      return <Volume className="w-6 h-6" />;
    } else {
      return <Volume2 className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex items-center space-x-2 group">
      <Button variant="ghost" size="icon" className="p-3 rounded-full">
        {renderVolumeIcon()}
      </Button>
      {/* Volume slider appears on hover */}
      <div className="overflow-hidden flex justify-center h-6 transition-all duration-200 w-0 group-hover:w-24">
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(value) => setVolume(value[0])}
          className="w-24"
        />
      </div>
    </div>
  );
};

export default VolumeControl;
