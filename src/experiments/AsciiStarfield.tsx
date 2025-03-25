'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * Represents a star in the starfield
 * @interface Star
 * @property {number} x - X position
 * @property {number} y - Y position
 * @property {number} z - Z position (depth)
 * @property {number} size - Size of the star
 * @property {string} char - Character representing the star
 * @property {number} brightness - Brightness of the star (0-1)
 */
interface Star {
	x: number;
	y: number;
	z: number;
	size: number;
	char: string;
	brightness: number;
}

const AsciiStarfield: React.FC = () => {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const starsRef = useRef<Star[]>([]);
	const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const touchActiveRef = useRef<boolean>(false);
	const animationFrameRef = useRef<number | null>(null);
	const speedRef = useRef<number>(1);

	// Configuration
	const [isMobile, setIsMobile] = useState(false);
	const starCount = isMobile ? 300 : 500;
	const maxDepth = 1000;
	const starChars = ['.', ':', '+', '*', 'o', 'O', '#', '@'];

	// Detect mobile devices
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Initialize starfield
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		// Create initial stars
		const initStars = () => {
			const stars: Star[] = [];
			const width = canvas.width;
			const height = canvas.height;

			for (let i = 0; i < starCount; i++) {
				// Random position across entire canvas with random depth
				stars.push({
					x: Math.random() * width - width / 2,
					y: Math.random() * height - height / 2,
					z: Math.random() * maxDepth,
					size: Math.random() * 2 + 1,
					char: starChars[Math.floor(Math.random() * starChars.length)],
					brightness: Math.random() * 0.5 + 0.5,
				});
			}

			return stars;
		};

		// Setup canvas
		const setupCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			starsRef.current = initStars();
		};

		setupCanvas();

		// Add event listeners
		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			// Normalize to -1 to 1 range from center
			mouseRef.current = {
				x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
				y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
			};
		};

		const handleTouchStart = (e: TouchEvent) => {
			touchActiveRef.current = true;
			handleTouchMove(e);
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (!touchActiveRef.current) return;
			e.preventDefault();
			
			const touch = e.touches[0];
			const rect = canvas.getBoundingClientRect();
			mouseRef.current = {
				x: ((touch.clientX - rect.left) / rect.width - 0.5) * 2,
				y: ((touch.clientY - rect.top) / rect.height - 0.5) * 2,
			};
		};

		const handleTouchEnd = () => {
			touchActiveRef.current = false;
			// Reset to center when touch ends
			mouseRef.current = { x: 0, y: 0 };
		};

		const handleClick = () => {
			// Increase speed on click, gradually return to normal
			speedRef.current = 3;
			setTimeout(() => {
				speedRef.current = 2;
				setTimeout(() => {
					speedRef.current = 1;
				}, 500);
			}, 500);
		};

		const handleResize = () => {
			setupCanvas();
		};

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('touchstart', handleTouchStart, { passive: false });
		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('touchend', handleTouchEnd);
		window.addEventListener('click', handleClick);
		window.addEventListener('resize', handleResize);

		// Animation loop
		const animate = () => {
			if (!canvas) return;

			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			const width = canvas.width;
			const height = canvas.height;
			const centerX = width / 2;
			const centerY = height / 2;

			// Clear canvas
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, width, height);

			// Get mouse influence for directional movement
			const mouseX = mouseRef.current.x * 5; // Amplify effect
			const mouseY = mouseRef.current.y * 5;

			// Update and render stars
			for (let i = 0; i < starsRef.current.length; i++) {
				const star = starsRef.current[i];

				// Move star closer (decrease z)
				star.z -= (8 + star.z / 100) * speedRef.current;

				// Add subtle mouse influence to movement
				star.x += mouseX * (star.z / maxDepth) * 0.2;
				star.y += mouseY * (star.z / maxDepth) * 0.2;

				// Reset star if it goes out of view
				if (
					star.z <= 0 ||
					Math.abs(star.x) > width ||
					Math.abs(star.y) > height
				) {
					star.z = maxDepth;
					star.x = (Math.random() - 0.5) * width;
					star.y = (Math.random() - 0.5) * height;
					star.char = starChars[Math.floor(Math.random() * starChars.length)];
					star.brightness = Math.random() * 0.5 + 0.5;
				}

				// Calculate screen position with perspective
				const scale = 300 / star.z;
				const screenX = centerX + star.x * scale;
				const screenY = centerY + star.y * scale;

				// Calculate size and opacity based on depth
				const relativeSize = Math.max(0.5, (maxDepth - star.z) / maxDepth) * 3;
				const opacity = Math.min(1, (1 - star.z / maxDepth) * 2 * star.brightness);

				// Skip rendering if star is too far or outside canvas
				if (
					opacity < 0.1 ||
					screenX < 0 ||
					screenX > width ||
					screenY < 0 ||
					screenY > height
				) {
					continue;
				}

				// Render star as ASCII character
				ctx.font = `${Math.ceil(relativeSize * 10)}px monospace`;
				ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.fillText(star.char, screenX, screenY);
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		// Start animation
		animate();

		// Cleanup
		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('touchend', handleTouchEnd);
			window.removeEventListener('click', handleClick);
			window.removeEventListener('resize', handleResize);
		};
	}, [isMobile, starCount]);

	return (
		<div className="fixed inset-0 -z-10 canvas-background touch-none cursor-pointer">
			<canvas
				ref={canvasRef}
				className="w-full h-full"
				aria-label="Interactive ASCII starfield visualization"
			/>
		</div>
	);
};

export default AsciiStarfield;