import { useRef, useState, useEffect, useCallback } from "react";

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  playbackTime: number;
  totalDuration: number;
  offset: number;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  handlePlayPauseResume: () => void;
  handleSeekStart: () => void;
  handleSeekChange: (value: number) => void;
  handleSeekEnd: () => void;
}

const useAudioPlayer = (
  audioBufferQueueRef: React.MutableRefObject<AudioBuffer[]>,
  isGenerating: boolean
): UseAudioPlayerReturn => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const wasPlayingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackStartOffset, setPlaybackStartOffset] = useState(0);
  const [playbackStartTime, setPlaybackStartTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [volume, setVolume] = useState(1);

  const RESUME_THRESHOLD = 1;

  // Create AudioContext and GainNode on mount.
  useEffect(() => {
    if (!audioContextRef.current) {
      const AudioContextConstructor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextConstructor();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = volume;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return () => {
      stopPlayback();
      audioContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update GainNode when volume changes.
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  // Calculate total duration from buffers.
  useEffect(() => {
    const buffers = audioBufferQueueRef.current;
    const duration = buffers.reduce((sum, buffer) => sum + buffer.duration, 0);
    setTotalDuration(duration);
  }, [audioBufferQueueRef.current.length]);

  // Update playbackTime at an interval while playing.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && audioContextRef.current) {
      interval = setInterval(() => {
        const elapsed = audioContextRef.current!.currentTime - playbackStartTime;
        const currentTime = playbackStartOffset + elapsed;
        setPlaybackTime(currentTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackStartOffset, playbackStartTime]);

  // Stop any currently scheduled sources.
  const stopPlayback = useCallback(() => {
    currentSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {
        console.error("Error stopping source:", e);
      }
    });
    currentSourcesRef.current = [];
    setIsPlaying(false);
  }, []);

  /**
   * Schedules and plays audio starting from a given offset (in seconds).
   */
  const playFromOffset = useCallback(
    (startOffset: number) => {
      if (!audioContextRef.current || !gainNodeRef.current) return;
      stopPlayback();

      const buffers = audioBufferQueueRef.current;
      if (buffers.length === 0) {
        console.warn("No audio buffers available");
        return;
      }

      let accumulated = 0;
      let startBufferIndex = 0;
      let offsetInBuffer = 0;
      for (let i = 0; i < buffers.length; i++) {
        if (accumulated + buffers[i].duration > startOffset) {
          startBufferIndex = i;
          offsetInBuffer = startOffset - accumulated;
          break;
        }
        accumulated += buffers[i].duration;
      }

      let scheduleTime = audioContextRef.current.currentTime;
      // Schedule the first (possibly partial) buffer.
      const firstBuffer = buffers[startBufferIndex];
      const source = audioContextRef.current.createBufferSource();
      source.buffer = firstBuffer;
      source.connect(gainNodeRef.current);
      source.start(scheduleTime, offsetInBuffer);
      currentSourcesRef.current.push(source);
      scheduleTime += firstBuffer.duration - offsetInBuffer;

      // Schedule subsequent buffers sequentially.
      for (let i = startBufferIndex + 1; i < buffers.length; i++) {
        const src = audioContextRef.current.createBufferSource();
        src.buffer = buffers[i];
        src.connect(gainNodeRef.current);
        src.start(scheduleTime);
        currentSourcesRef.current.push(src);
        scheduleTime += buffers[i].duration;
      }

      setIsPlaying(true);
      setIsPaused(false);
      setPlaybackStartOffset(startOffset);
      setPlaybackStartTime(audioContextRef.current.currentTime);

      // When the last source ends, decide what to do.
      const lastSource =
        currentSourcesRef.current[currentSourcesRef.current.length - 1];
      lastSource.onended = () => {
        if (isGenerating) {
          // If still generating, enter loading state.
          setIsLoading(true);
          setIsPlaying(false);
          setPlaybackTime(totalDuration);
        } else {
          setPlaybackTime(0);
          setOffset(0);
          setIsPlaying(false);
        }
      };
    },
    [audioBufferQueueRef, isGenerating, stopPlayback, totalDuration]
  );

  // Auto-resume playback when enough new audio is available.
  useEffect(() => {
    if (isLoading && totalDuration - playbackTime >= RESUME_THRESHOLD) {
      playFromOffset(playbackTime);
      setIsLoading(false);
    }
  }, [isLoading, totalDuration, playbackTime, playFromOffset]);

  // Handle Play/Pause/Resume button.
  const handlePlayPauseResume = () => {
    if (isLoading) return;

    if (!isPlaying && !isPaused) {
      playFromOffset(offset);
    } else if (isPlaying) {
      if (audioContextRef.current) {
        const elapsed =
          audioContextRef.current.currentTime - playbackStartTime;
        const newOffset = playbackStartOffset + elapsed;
        currentSourcesRef.current.forEach((src) => (src.onended = null));
        stopPlayback();
        setPlaybackTime(newOffset);
        setIsPaused(true);
      }
    } else if (isPaused) {
      playFromOffset(playbackTime);
    }
  };

  // --- Seek Handlers ---
  const handleSeekStart = () => {
    wasPlayingRef.current = isPlaying;
    if (isPlaying) {
      currentSourcesRef.current.forEach((src) => (src.onended = null));
      stopPlayback();
    }
  };

  const handleSeekChange = (newOffset: number) => {
    setOffset(newOffset);
    setPlaybackTime(newOffset);
  };

  const handleSeekEnd = () => {
    if (wasPlayingRef.current) {
      playFromOffset(offset);
    }
  };

  return {
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
  };
};

export default useAudioPlayer;
