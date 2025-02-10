import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define (or import) the Voice interface
interface Voice {
  id: string;
  name: string;
  language: string;
  gender: "Male" | "Female";
  traits?: string;
  targetQuality: string;
  overallGrade: string;
}

interface VoiceSelectorProps {
  voice: string;
  voices: Voice[];
  onVoiceChange: (voice: string) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voice,
  voices,
  onVoiceChange,
  disabled,
}) => {
  // You can customize this display string as needed.
  const getVoiceDisplayName = (voice: Voice) => {
    return `${voice.name} (${voice.language}, ${voice.gender})`;
  };

  return (
    <div className="w-full md:w-[200px]">
      <Select
        value={voice}
        onValueChange={(value) => onVoiceChange(value)}
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
