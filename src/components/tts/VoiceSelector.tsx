// VoiceSelector.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTTSWorker } from "@/context/TTSWorkerContext";
import { Mars, Venus, Play } from "lucide-react";
import { CloudyCircle } from "./CloudyCircle";
import { voiceAudioMap } from "@/utils/voiceAudio";

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
  // Create a ref to store the current audio element.
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Set default voice if none is selected.
  useEffect(() => {
    if (!voice && voices.length > 0) {
      onVoiceChange(voices[0].id);
    }
  }, [voice, voices, onVoiceChange]);

  // Filter voices by name, language, or gender.
  const filteredVoices = voices.filter((v: Voice) =>
    [v.name, v.language, v.gender].some((field) =>
      field.toLowerCase().includes(filter.toLowerCase())
    )
  );

  // When mouse enters, play the audio.
  const handleMouseEnterAudio = (voiceId: string) => {
    const audioSrc = voiceAudioMap[voiceId];
    if (audioSrc) {
      const audio = new Audio(audioSrc);
      audioRef.current = audio;
      audio.play().catch((err) => console.error("Error playing audio:", err));
    }
  };

  // When mouse leaves, stop the audio.
  const handleMouseLeaveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Render voice item with profile picture, name, gender icon, language, and overallGrade.
  const renderVoiceItem = (voice: Voice) => {
    const isMale = voice.gender.toLowerCase() === "male";
    const hasAudio = !!voiceAudioMap[voice.id];

    return (
      <div className="flex items-center space-x-2">
        {/* Wrap the CloudyCircle in a relative container so we can show an overlay on hover */}
        <div className="relative group overflow-hidden rounded-full">
          <CloudyCircle aid={voice.id} size={30} />
          <div
            className="absolute inset-0 flex items-center justify-center 
                    bg-black bg-opacity-20 text-white 
                    opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {hasAudio ? (
              <button
                onMouseEnter={() => handleMouseEnterAudio(voice.id)}
                onMouseLeave={handleMouseLeaveAudio}
                className="p-1 rounded hover:bg-white hover:bg-opacity-20 cursor-pointer"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{voice.name}</span>
            {isMale ? (
              <Mars className="w-4 h-4 text-blue-400" />
            ) : (
              <Venus className="w-4 h-4 text-pink-400" />
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {voice.language} | {voice.overallGrade || "N/A"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full md:w-[200px]">
      <Select value={voice} onValueChange={onVoiceChange} disabled={disabled}>
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
                className="
                  relative 
                  data-[state=selected]:bg-blue-100
                  [&>[data-radix-select-item-indicator]]:hidden
                "
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
