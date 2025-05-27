"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Webcam from "react-webcam";

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
	const [isMobile, setIsMobile] = useState(false);
	const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
	const [isCapturing, setIsCapturing] = useState(false);
	const [showFlash, setShowFlash] = useState(false);
	const [isFlipping, setIsFlipping] = useState(false);
	const [showBarnDoor, setShowBarnDoor] = useState(false);
	const [isBlurred, setIsBlurred] = useState(false);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const asciiConfig = useMemo<AsciiConfig>(
		() => ({
			chars: [" ", ".", ":", "-", "~", "=", "+", "*", "#", "%", "@"],
			cellSize: isMobile ? 6 : 4,
			fontSize: isMobile ? 6 : 4,
			backgroundColor: "black",
			textColor: "white",
		}),
		[isMobile],
	);

	// Initialize canvas with background color
	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			const ctx = canvas.getContext("2d", { willReadFrequently: true });
			if (ctx) {
				ctx.fillStyle = asciiConfig.backgroundColor;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
	}, [asciiConfig.backgroundColor]);

	// Processes a single frame of video into ASCII art
	const processImageData = useCallback(
		(
			imageData: ImageData,
			ctx: CanvasRenderingContext2D,
			config: AsciiConfig,
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
						(cappedBrightness / 255) * (chars.length - 1),
					);
					ctx.fillText(chars[charIndex], x, y);
				}
			}
		},
		[],
	);

	// processes a single frame from the webcam
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
					// Maintain background color when canvas is resized
					const ctx = canvas.getContext("2d");
					if (ctx) {
						ctx.fillStyle = asciiConfig.backgroundColor;
						ctx.fillRect(0, 0, videoWidth, videoHeight);
					}
				}

				const ctx = canvas.getContext("2d");
				if (ctx) {
					// flip for front-facing camera
					if (facingMode === "user") {
						ctx.save();
						ctx.scale(-1, 1);
						ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
						ctx.restore();
					} else {
						ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
					}

					const imageData = ctx.getImageData(0, 0, videoWidth, videoHeight);
					processImageData(imageData, ctx, asciiConfig);
				}
			}
		}
	}, [processImageData, asciiConfig, facingMode]);

	useEffect(() => {
		const processFrame = () => {
			captureAndProcess();
			animationFrameRef.current = requestAnimationFrame(processFrame);
		};

		if (isVideoReady) {
			processFrame();
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [isVideoReady, captureAndProcess]);

	const downloadCanvasAsImage = useCallback((canvas: HTMLCanvasElement) => {
		const link = document.createElement("a");
		link.download = `ascii-photo-${Date.now()}.png`;
		link.href = canvas.toDataURL("image/png");
		link.click();
	}, []);

	const takePhoto = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		setShowFlash(true);
		setIsCapturing(true);

		setTimeout(() => {
			downloadCanvasAsImage(canvas);

			// Reset UI
			setTimeout(() => {
				setShowFlash(false);
				setIsCapturing(false);
			}, 300);
		}, 100);
	}, [downloadCanvasAsImage]);

	const flipCamera = useCallback(() => {
		setIsFlipping(true);
		setIsBlurred(true);
		setShowBarnDoor(true);

		setTimeout(() => {
			setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
		}, 225);

		setTimeout(() => {
			setShowBarnDoor(false);
			setIsFlipping(false);
		}, 500);
	}, []);

	return (
		<>
			<div className="fixed inset-0 z-0 canvas-background touch-none pointer-events-none">
				<Webcam
					key={facingMode}
					ref={webcamRef}
					audio={false}
					videoConstraints={{
						facingMode: facingMode,
					}}
					className={`absolute inset-0 w-full h-full object-cover ${
						isVideoReady ? "opacity-0" : "invisible"
					}`}
					onLoadedMetadata={() => {
						setIsVideoReady(true);
						// Remove blur when new camera view is loaded
						if (isBlurred) {
							setTimeout(() => {
								setIsBlurred(false);
							}, 100);
						}
					}}
				/>
				<canvas
					ref={canvasRef}
					className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
						isBlurred ? "blur-md" : ""
					}`}
				/>
				{/* Flash Effect */}
				{showFlash && (
					<div className="absolute inset-0 bg-black animate-flash pointer-events-none" />
				)}

				{/* Barn Door */}
				{showBarnDoor && (
					<>
						<div className="absolute inset-y-0 left-0 w-1/2 bg-black animate-barn-door-left z-10" />
						<div className="absolute inset-y-0 right-0 w-1/2 bg-black animate-barn-door-right z-10" />
					</>
				)}
			</div>

			{/* cam controls */}
			{isVideoReady && (
				<div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
					<div className="relative flex items-center justify-center">
						{/* Camera Button - Always centered */}
						<button
							type="button"
							onClick={takePhoto}
							className={`relative w-16 h-16 rounded-full transition-all ${
								isCapturing ? "scale-95" : ""
							}`}
							aria-label="Take photo"
						>
							{/* Outer white ring */}
							<div className="absolute inset-0 rounded-full bg-white" />
							{/* Inner button with clear border */}
							<div
								className={`absolute inset-[3px] rounded-full bg-white border-2 border-black transition-all ${
									isCapturing ? "bg-gray-300 scale-95" : ""
								}`}
							/>
						</button>

						{/* Cam Flip Button (mobile only) */}
						{isMobile && (
							<button
								type="button"
								onClick={flipCamera}
								className={`absolute left-[calc(100%+16px)] w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-sm flex items-center justify-center transition-all ${
									isFlipping ? "scale-90" : ""
								}`}
								aria-label="Flip camera"
							>
								<svg
									className="w-5 h-5 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<title>Flip camera</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									/>
								</svg>
							</button>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default WebcamAscii;
