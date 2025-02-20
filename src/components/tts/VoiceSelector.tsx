import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTTSWorker } from "@/context/TTSWorkerContext";
import { Filter, Mars, Venus } from "lucide-react";

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  overallGrade?: string;
}

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
  const { voices } = useTTSWorker();
  const [filter, setFilter] = useState("");

  // Set default voice if none is selected.
  useEffect(() => {
    if (!voice && voices.length > 0) {
      onVoiceChange(voices[0].id);
    }
  }, [voice, voices, onVoiceChange]);

  // Filter voices by name, language, or gender.
  const filteredVoices = voices.filter(
    (v: Voice) =>
      v.name.toLowerCase().includes(filter.toLowerCase()) ||
      v.language.toLowerCase().includes(filter.toLowerCase()) ||
      v.gender.toLowerCase().includes(filter.toLowerCase())
  );

  // Render voice item with name, gender icon, language, and overallGrade.
  const renderVoiceItem = (voice: Voice) => {
    const isMale = voice.gender.toLowerCase() === "male";
    return (
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="font-medium">{voice.name}</span>
          {isMale ? (
            <Mars className="w-4 h-4 text-blue-400" />
          ) : (
            <Venus className="w-4 h-4 text-pink-400" />
          )}
          <div className="text-xs text-muted-foreground">
            {voice.language} | {voice.overallGrade || "N/A"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-[200px]">
      <Select value={voice} onValueChange={onVoiceChange} disabled={disabled} >
        <SelectTrigger>
          <SelectValue placeholder="Select a voice" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="p-2">
            <div className="mb-2 flex items-center space-x-2 border-b pb-2">
              <input
                type="text"
                placeholder="Filter voices..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </div>
            {filteredVoices.map((v: Voice) => (
              <SelectItem
                key={v.id}
                value={v.id}
                className="data-[state=selected]:bg-blue-100" // Highlight selected item with a background color.
              >
                {renderVoiceItem(v)}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
};

export default VoiceSelector;
