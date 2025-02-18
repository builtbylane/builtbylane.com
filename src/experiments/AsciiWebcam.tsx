'use client';

import type React from 'react';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Webcam from 'react-webcam';

interface AsciiConfig {
  chars: string[];
  cellSize: number;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
}

const WebcamAscii: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const animationFrameRef = useRef<number>();

  const asciiConfig = useMemo<AsciiConfig>(
    () => ({
      chars: [' ', '.', ':', '-', '~', '=', '+', '*', '#', '%', '@'],

      cellSize: 4,
      fontSize: 4,
      backgroundColor: 'black',
      textColor: 'white',
    }),
    []
  );

  // Processes a single frame of video into ASCII art
  const processImageData = useCallback(
    (
      imageData: ImageData,
      ctx: CanvasRenderingContext2D,
      config: AsciiConfig
    ) => {
      const { width, height, data } = imageData;
      const { chars, cellSize, fontSize } = config;

      // Clear canvas with background color
      ctx.fillStyle = config.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Set text properties
      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = config.textColor;

      // Process image in cell-sized chunks
      for (let y = 0; y < height; y += cellSize) {
        for (let x = 0; x < width; x += cellSize) {
          let totalBrightness = 0;
          let samples = 0;

          // Sample pixels in the current cell
          for (let dy = 0; dy < cellSize && y + dy < height; dy++) {
            for (let dx = 0; dx < cellSize && x + dx < width; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4;
              // Calculate perceived brightness using ITU-R BT.601 coefficients
              const brightness =
                (data[i] * 0.299 + // Red
                  data[i + 1] * 0.587 + // Green
                  data[i + 2] * 0.114) * // Blue
                0.8; // Apply a darkening factor of 0.8
              totalBrightness += brightness;
              samples++;
            }
          }

          // Calculate average brightness and map to ASCII character
          const averageBrightness = totalBrightness / samples;
          // Cap the maximum brightness at 200 (out of 255) to prevent overly bright spots
          const cappedBrightness = Math.min(averageBrightness, 200);
          const charIndex = Math.floor(
            (cappedBrightness / 255) * (chars.length - 1)
          );
          ctx.fillText(chars[charIndex], x, y);
        }
      }
    },
    []
  );

  // Captures and processes a single frame from the webcam
  const captureAndProcess = useCallback(() => {
    const webcam = webcamRef.current;
    const canvas = canvasRef.current;

    if (webcam && canvas) {
      const video = webcam.video;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const { videoWidth, videoHeight } = video;

        // Update canvas dimensions if needed
        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
          processImageData(imageData, ctx, asciiConfig);
        }
      }
    }
  }, [processImageData, asciiConfig]);

  // Set up animation loop when video is ready
  useEffect(() => {
    const processFrame = () => {
      captureAndProcess();
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    if (isVideoReady) {
      processFrame();
    }

    // Cleanup function to cancel animation frame
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVideoReady, captureAndProcess]);

  return (
    <div className="fixed inset-0 -z-10 canvas-background touch-none pointer-events-none">
      <Webcam
        ref={webcamRef}
        audio={false}
        className="absolute inset-0 w-full h-full object-cover"
        onLoadedMetadata={() => setIsVideoReady(true)}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default WebcamAscii;
