export const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const paddedSeconds = s < 10 ? `0${s}` : s;
    return `${m}:${paddedSeconds}`;
  };
