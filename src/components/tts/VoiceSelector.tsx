import React, { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTSWorker } from "@/context/TTSWorkerContext"; // Adjust the path as needed

interface VoiceSelectorProps {
  voice: string;
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voice,
  onVoiceChange,
  disabled,
}) => {
  // Retrieve voices from the context
  const { voices } = useTTSWorker();

  // Set default voice if not already selected and voices are available.
  useEffect(() => {
    if (!voice && voices.length > 0) {
      onVoiceChange(voices[0].id);
    }
  }, [voice, voices, onVoiceChange]);

  // Customize the display string for each voice
  const getVoiceDisplayName = (voice: { name: string; language: string; gender: string; }) => {
    return `${voice.name} (${voice.language}, ${voice.gender})`;
  };

  return (
    <div className="w-full md:w-[200px]">
      <Select
        value={voice}
        onValueChange={onVoiceChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent>
          {voices.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              {getVoiceDisplayName(v)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VoiceSelector;
