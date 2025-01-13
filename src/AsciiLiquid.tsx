import React, { useEffect, useRef, useState, useCallback } from 'react';

/**
 * inspired by https://x.com/gaetanpautler/status/1663481949963407360
 */
const AsciiLiquid: React.FC = () => {
  const [characters, setCharacters] = useState<string[]>([]);
  const frameRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Character dimensions for position correction
  const CHAR_ASPECT = 0.5; // Approximate width/height ratio of monospace characters

  const generateFrame = useCallback((time: number) => {
    if (!containerRef.current) return;

    // Calculate dimensions based on container size
    const width = Math.floor(containerRef.current.offsetWidth / 6);
    const height = Math.floor(containerRef.current.offsetHeight / 12);

    const newChars: string[] = [];
    // Characters used for density mapping, from least to most dense
    const density = ' .:-=+*%@#';

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Adjust x coordinate for character aspect ratio
        const adjustedX = (x / width) * CHAR_ASPECT;

        // base fluid movement
        const baseFluid =
          Math.sin(x * 0.05 + time * 0.001) * 0.5 +
          Math.sin(y * 0.05 + time * 0.001) * 0.5;

        // circular ripple pattern
        const rippleCenter = {
          x: Math.sin(time * 0.001) * 0.5 + 0.5,
          y: Math.cos(time * 0.0015) * 0.5 + 0.5,
        };
        const dx = adjustedX - rippleCenter.x;
        const dy = y / height - rippleCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // expanding ripples
        const ripples =
          Math.sin(distance * 3 - time * 0.002) *
          Math.exp(-distance * 1.5) *
          0.3;

        // combine effects
        const noise = baseFluid * 1.2 + ripples;

        // map combined effect to character density
        const normalized = (noise + 2) / 4;
        const charIndex = Math.floor(normalized * density.length);
        newChars.push(
          density[Math.min(Math.max(charIndex, 0), density.length - 1)]
        );
      }
      newChars.push('\n');
    }

    setCharacters(newChars);
    frameRef.current = requestAnimationFrame(generateFrame);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(generateFrame);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [generateFrame]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 bg-black overflow-hidden select-none"
    >
      <pre className="w-full h-full text-cyan-800 font-mono leading-none text-xs">
        {characters.join('')}
      </pre>
    </div>
  );
};

export default AsciiLiquid;
