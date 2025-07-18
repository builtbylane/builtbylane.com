"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function MetaballsExperiment() {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const canvas = document.createElement("canvas");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		container.appendChild(canvas);

		// Get the 2D context
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return;

		// Create THREE.js scene
		const scene = new THREE.Scene();
		const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
		camera.position.z = 1;

		// WebGL renderer
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			preserveDrawingBuffer: true,
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setClearColor(0x000000, 0);

		// metaballs shader
		const shader = {
			uniforms: {
				uTime: { value: 0 },
				uMouse: { value: new THREE.Vector2(0.5, 0.5) },
				uMouse2: { value: new THREE.Vector2(0.5, 0.5) },
				uAspect: { value: window.innerWidth / window.innerHeight },
				uIsClicking: { value: 0 },
				uIsClicking2: { value: 0 },
				uHasSecondPointer: { value: 0 },
				uTouchFade: { value: 0 },
				uTouchFade2: { value: 0 },
				uIsTouch: { value: 0 },
			},
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				uniform float uTime;
				uniform vec2 uMouse;
				uniform vec2 uMouse2;
				uniform float uAspect;
				uniform float uIsClicking;
				uniform float uIsClicking2;
				uniform float uHasSecondPointer;
				uniform float uTouchFade;
				uniform float uTouchFade2;
				uniform float uIsTouch;
				varying vec2 vUv;
				
				float metaball(vec2 p, vec2 center, float radius) {
					vec2 adjustedP = vec2(p.x * uAspect, p.y);
					vec2 adjustedCenter = vec2(center.x * uAspect, center.y);
					return radius / length(adjustedP - adjustedCenter);
				}
				
				void main() {
					vec2 p = vUv;
					float centerX = 0.5;
					float centerY = 0.5;
					
					float elasticFactor = uIsClicking * (1.0 + 0.15 * sin(uIsClicking * 3.14159));
					float baseSizeFactor = mix(1.0, uTouchFade, uIsTouch);
					float mouseRadius = baseSizeFactor * (0.035 + (elasticFactor * 0.008));
					
					float elasticFactor2 = uIsClicking2 * (1.0 + 0.15 * sin(uIsClicking2 * 3.14159));
					float baseSizeFactor2 = mix(1.0, uTouchFade2, uIsTouch);
					float mouseRadius2 = baseSizeFactor2 * (0.035 + (elasticFactor2 * 0.008));
					
					vec2 center1 = uMouse;
					vec2 center1b = uMouse2;
					vec2 center2 = vec2(centerX + 0.12 * cos(uTime * 0.41), centerY + 0.12 * sin(uTime * 0.39));
					vec2 center3 = vec2(centerX + 0.08 * sin(uTime * 0.57), centerY + 0.14 * cos(uTime * 0.43));
					vec2 center4 = vec2(centerX + 0.15 * cos(uTime * 0.37), centerY + 0.07 * sin(uTime * 0.51));
					vec2 center5 = vec2(centerX + 0.09 * sin(uTime * 0.61), centerY + 0.11 * sin(uTime * 0.53));
					vec2 center6 = vec2(centerX + 0.11 * cos(uTime * 0.33), centerY + 0.13 * cos(uTime * 0.49));
					vec2 center7 = vec2(centerX + 0.08 * sin(uTime * 0.45), centerY + 0.09 * sin(uTime * 0.55));
					vec2 center8 = vec2(centerX + 0.13 * sin(uTime * 0.29), centerY + 0.12 * cos(uTime * 0.63));
					
					float v = 0.0;
					v += metaball(p, center1, mouseRadius);
					v += metaball(p, center1b, mouseRadius2) * uHasSecondPointer;
					v += metaball(p, center2, 0.045); 
					v += metaball(p, center3, 0.036); 
					v += metaball(p, center4, 0.045); 
					v += metaball(p, center5, 0.036); 
					v += metaball(p, center6, 0.054); 
					v += metaball(p, center7, 0.045); 
					v += metaball(p, center8, 0.036); 
					
					float threshold = 1.6; 
					float smoothness = 1.5;
					
					float metaballField = smoothstep(threshold - smoothness, threshold + 0.4, v);
					metaballField = pow(metaballField, 1.2) * 0.8;
					
					gl_FragColor = vec4(vec3(metaballField), 1.0);
				}
			`,
		};

		// Create plane for rendering
		const geometry = new THREE.PlaneGeometry(2, 2);
		const material = new THREE.ShaderMaterial({
			uniforms: shader.uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
		});
		const plane = new THREE.Mesh(geometry, material);
		scene.add(plane);

		// State variables
		let isClicking = false;
		let isClicking2 = false;
		let clickAnimation = 0;
		let clickAnimation2 = 0;
		let touchFade = 0;
		let touchFade2 = 0;
		let rafId: number | null = null;
		const startTime = Date.now();
		const activeTouches = new Map<
			number,
			{ x: number; y: number; fadeIn: number }
		>();
		let isTouch = false;

		// Event handlers
		function handleMouseMove(e: MouseEvent) {
			if (!container) return;
			const rect = container.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1 - (e.clientY - rect.top) / rect.height;

			if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
				shader.uniforms.uMouse.value.x = x;
				shader.uniforms.uMouse.value.y = y;
			}
		}

		function handleMouseDown() {
			isClicking = true;
		}

		function handleMouseUp() {
			isClicking = false;
		}

		function handleTouchMove(e: TouchEvent) {
			if (!container) return;
			const rect = container.getBoundingClientRect();

			// Update all active touches
			for (let i = 0; i < e.touches.length; i++) {
				const touch = e.touches[i];
				const x = (touch.clientX - rect.left) / rect.width;
				const y = 1 - (touch.clientY - rect.top) / rect.height;
				if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
					const existing = activeTouches.get(touch.identifier);
					activeTouches.set(touch.identifier, {
						x,
						y,
						fadeIn: existing ? existing.fadeIn : 0,
					});
				}
			}

			// Update shader uniforms based on active touches
			const touchArray = Array.from(activeTouches.values());
			if (touchArray.length > 0) {
				shader.uniforms.uMouse.value.x = touchArray[0].x;
				shader.uniforms.uMouse.value.y = touchArray[0].y;
			}
			if (touchArray.length > 1) {
				shader.uniforms.uMouse2.value.x = touchArray[1].x;
				shader.uniforms.uMouse2.value.y = touchArray[1].y;
				shader.uniforms.uHasSecondPointer.value = 1;
			} else {
				shader.uniforms.uHasSecondPointer.value = 0;
			}
		}

		function handleTouchStart(e: TouchEvent) {
			if (!container) return;
			const rect = container.getBoundingClientRect();

			// Add new touches to the map
			for (let i = 0; i < e.changedTouches.length; i++) {
				const touch = e.changedTouches[i];
				const x = (touch.clientX - rect.left) / rect.width;
				const y = 1 - (touch.clientY - rect.top) / rect.height;
				if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
					activeTouches.set(touch.identifier, { x, y, fadeIn: 0 });
				}
			}

			// Update clicking states
			if (activeTouches.size >= 1) {
				isClicking = true;
				isTouch = true;
				shader.uniforms.uIsTouch.value = 1;
			}
			if (activeTouches.size >= 2) {
				isClicking2 = true;
			}

			// Update shader uniforms
			const touchArray = Array.from(activeTouches.values());
			if (touchArray.length > 0) {
				shader.uniforms.uMouse.value.x = touchArray[0].x;
				shader.uniforms.uMouse.value.y = touchArray[0].y;
			}
			if (touchArray.length > 1) {
				shader.uniforms.uMouse2.value.x = touchArray[1].x;
				shader.uniforms.uMouse2.value.y = touchArray[1].y;
				shader.uniforms.uHasSecondPointer.value = 1;
			}
		}

		function handleTouchEnd(e: TouchEvent) {
			// Remove ended touches from the map
			for (let i = 0; i < e.changedTouches.length; i++) {
				activeTouches.delete(e.changedTouches[i].identifier);
			}

			// Update clicking states
			if (activeTouches.size === 0) {
				isClicking = false;
				isClicking2 = false;
			} else if (activeTouches.size === 1) {
				isClicking2 = false;
			}

			// Update shader uniforms
			if (activeTouches.size < 2) {
				shader.uniforms.uHasSecondPointer.value = 0;
			}
		}

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("mouseup", handleMouseUp);
		window.addEventListener("touchmove", handleTouchMove, { passive: false });
		window.addEventListener("touchstart", handleTouchStart, { passive: false });
		window.addEventListener("touchend", handleTouchEnd, { passive: false });

		// Handle window resize
		function handleResize() {
			const width = window.innerWidth;
			const height = window.innerHeight;

			canvas.width = width;
			canvas.height = height;

			renderer.setSize(width, height);
			shader.uniforms.uAspect.value = width / height;

			const fontSize = Math.max(4, Math.floor(width / 160));
			if (!ctx) return;
			ctx.font = `${fontSize}px monospace`;
			ctx.textBaseline = "top";
		}

		window.addEventListener("resize", handleResize);
		handleResize();

		// Define ASCII characters
		const asciiChars = " .:-=+*#%@";

		// Initialize font
		ctx.font = `${Math.max(4, Math.floor(window.innerWidth / 160))}px monospace`;
		ctx.textBaseline = "top";

		// Animation function
		function animate() {
			// Update time
			const elapsedTime = (Date.now() - startTime) / 1000;
			shader.uniforms.uTime.value = elapsedTime;

			// Update click animations
			if (isClicking && clickAnimation < 1.0) {
				clickAnimation = Math.min(1.0, clickAnimation + 0.08);
			} else if (!isClicking && clickAnimation > 0.0) {
				clickAnimation = Math.max(0.0, clickAnimation - 0.05);
			}
			shader.uniforms.uIsClicking.value = clickAnimation;

			if (isClicking2 && clickAnimation2 < 1.0) {
				clickAnimation2 = Math.min(1.0, clickAnimation2 + 0.08);
			} else if (!isClicking2 && clickAnimation2 > 0.0) {
				clickAnimation2 = Math.max(0.0, clickAnimation2 - 0.05);
			}
			shader.uniforms.uIsClicking2.value = clickAnimation2;

			// Update touch fade animations
			if (isTouch) {
				const touchArray = Array.from(activeTouches.values());

				// Update fade for first touch
				if (touchArray.length > 0 && touchFade < 1.0) {
					touchFade = Math.min(1.0, touchFade + 0.24);
				} else if (touchArray.length === 0 && touchFade > 0.0) {
					touchFade = Math.max(0.0, touchFade - 0.16);
				}
				shader.uniforms.uTouchFade.value = touchFade;

				// Update fade for second touch
				if (touchArray.length > 1 && touchFade2 < 1.0) {
					touchFade2 = Math.min(1.0, touchFade2 + 0.24);
				} else if (touchArray.length <= 1 && touchFade2 > 0.0) {
					touchFade2 = Math.max(0.0, touchFade2 - 0.16);
				}
				shader.uniforms.uTouchFade2.value = touchFade2;
			}

			// Get dimensions
			const width = canvas.width;
			const height = canvas.height;

			try {
				// Render THREE.js scene
				renderer.render(scene, camera);

				// Get pixel data
				const gl = renderer.getContext();
				const pixels = new Uint8Array(width * height * 4);
				gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
				if (!ctx) return;
				// Clear canvas and set styles
				ctx.clearRect(0, 0, width, height);
				ctx.fillStyle = "black";
				ctx.fillRect(0, 0, width, height);
				ctx.fillStyle = "white";

				// Calculate cell size and grid
				const cellSize = Math.max(4, Math.floor(width / 160));
				const cols = Math.floor(width / cellSize);
				const rows = Math.floor(height / cellSize);

				// Draw ASCII representation
				for (let y = 0; y < rows; y++) {
					for (let x = 0; x < cols; x++) {
						const pixelX = Math.floor(x * cellSize);
						const pixelY = height - Math.floor(y * cellSize) - 1;
						const pixelIndex = (pixelY * width + pixelX) * 4;

						const brightness = pixels[pixelIndex] / 255;

						if (brightness < 0.05) continue;

						const charIndex = Math.floor(brightness * (asciiChars.length - 1));
						ctx.fillText(asciiChars[charIndex], x * cellSize, y * cellSize);
					}
				}
			} catch (error) {
				console.error("Animation error:", error);
			}

			// Request next frame
			rafId = requestAnimationFrame(animate);
		}

		animate();

		return () => {
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
			}

			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mousedown", handleMouseDown);
			window.removeEventListener("mouseup", handleMouseUp);
			window.removeEventListener("touchmove", handleTouchMove);
			window.removeEventListener("touchstart", handleTouchStart);
			window.removeEventListener("touchend", handleTouchEnd);
			window.removeEventListener("resize", handleResize);

			// Clean up THREE.js resources
			geometry.dispose();
			material.dispose();
			renderer.dispose();

			// Remove canvas
			if (canvas.parentNode === container) {
				container.removeChild(canvas);
			}
		};
	}, []);

	return (
		<div
			ref={containerRef}
			className="fixed inset-0 w-full h-screen bg-black touch-none cursor-pointer canvas-background"
			role="img"
			aria-label="Interactive metaballs experiment with ASCII rendering"
		/>
	);
}
