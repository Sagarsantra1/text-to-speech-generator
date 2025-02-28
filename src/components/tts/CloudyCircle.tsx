import React, { useEffect, useRef } from "react";

interface CloudyCircleProps {
  aid: string;
  size?: number;
}

export const CloudyCircle: React.FC<CloudyCircleProps> = ({ aid, size = 40 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Helper: Convert a string to a numeric seed
  function hashStringToSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return hash >>> 0; // Ensure a positive number
  }

  // Helper: Mulberry32 seeded PRNG
  function mulberry32(a: number): () => number {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = size;
    canvas.height = size;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Create a seeded random generator based on aid.
    const seed = hashStringToSeed(aid);
    const random = mulberry32(seed);

    // Generate a base color from the seed:
    // Use the seed to compute a hue (0-359 degrees) for a pastel color.
    const baseHue = seed % 360;
    const baseColor = `hsl(${baseHue}, 70%, 80%)`;

    // Draw base circle with the generated base color.
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = baseColor;
    ctx.fill();

    // Clip drawing to the circle.
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.clip();

    // Draw random "cloudy" blobs for texture.
    const blobCount = 10;
    for (let i = 0; i < blobCount; i++) {
      const angle = random() * Math.PI * 2;
      const dist = random() * radius;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      const blobSize = size * 0.1 + random() * (size * 0.2);
      const alpha = 0.2 + random() * 0.5;

      ctx.beginPath();
      ctx.arc(x, y, blobSize, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }, [aid, size]);

  return <canvas ref={canvasRef} style={{ borderRadius: "50%" }} />;
};
