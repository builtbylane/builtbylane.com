'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function MetaballsExperiment() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Update dimensions state
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Create ASCII canvas
    const asciiCanvas = document.createElement('canvas');
    asciiCanvas.width = dimensions.width || window.innerWidth;
    asciiCanvas.height = dimensions.height || window.innerHeight;
    const asciiCtx = asciiCanvas.getContext('2d');
    containerRef.current.appendChild(asciiCanvas);

    // Scene setup
    const scene = new THREE.Scene();

    // Use orthographic camera to cover the entire viewport without perspective distortion
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(
      dimensions.width || window.innerWidth,
      dimensions.height || window.innerHeight
    );
    renderer.setClearColor(0x000000, 0); // Transparent background

    // Create shader material for metaballs
    const metaballShader = {
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: new THREE.Vector2(
            dimensions.width || window.innerWidth,
            dimensions.height || window.innerHeight
          ),
        },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: {
          value:
            (dimensions.width || window.innerWidth) /
            (dimensions.height || window.innerHeight),
        },
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
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uAspect;
  varying vec2 vUv;
  
  float metaball(vec2 p, vec2 center, float radius) {
    // Adjust x coordinate based on aspect ratio to maintain circular shape
    vec2 adjustedP = vec2(p.x * uAspect, p.y);
    vec2 adjustedCenter = vec2(center.x * uAspect, center.y);
    return radius / length(adjustedP - adjustedCenter);
  }
  
  void main() {
    vec2 p = vUv;
    
    // Calculate metaballs in the central area
    float centerX = 0.5;
    float centerY = 0.5;
    
    // Make the first metaball follow the mouse position
    vec2 center1 = uMouse;
    vec2 center2 = vec2(centerX + 0.12 * cos(uTime * 0.41), centerY + 0.12 * sin(uTime * 0.39));
    vec2 center3 = vec2(centerX + 0.08 * sin(uTime * 0.57), centerY + 0.14 * cos(uTime * 0.43));
    vec2 center4 = vec2(centerX + 0.15 * cos(uTime * 0.37), centerY + 0.07 * sin(uTime * 0.51));
    vec2 center5 = vec2(centerX + 0.09 * sin(uTime * 0.61), centerY + 0.11 * sin(uTime * 0.53));
    vec2 center6 = vec2(centerX + 0.11 * cos(uTime * 0.33), centerY + 0.13 * cos(uTime * 0.49));
    vec2 center7 = vec2(centerX + 0.08 * sin(uTime * 0.45), centerY + 0.09 * sin(uTime * 0.55));
    vec2 center8 = vec2(centerX + 0.13 * sin(uTime * 0.29), centerY + 0.12 * cos(uTime * 0.63));
    vec2 center9 = vec2(centerX + 0.07 * cos(uTime * 0.53), centerY + 0.15 * sin(uTime * 0.31));
    vec2 center10 = vec2(centerX + 0.14 * sin(uTime * 0.47), centerY + 0.08 * cos(uTime * 0.59));
    vec2 center11 = vec2(centerX + 0.06 * cos(uTime * 0.65), centerY + 0.11 * sin(uTime * 0.37));
    vec2 center12 = vec2(centerX + 0.1 * sin(uTime * 0.43), centerY + 0.13 * cos(uTime * 0.51));
    vec2 center13 = vec2(centerX + 0.18 * sin(uTime * 0.27), centerY + 0.16 * cos(uTime * 0.35));
    vec2 center14 = vec2(centerX + 0.16 * cos(uTime * 0.38), centerY + 0.17 * sin(uTime * 0.42));
    vec2 center15 = vec2(centerX + 0.19 * sin(uTime * 0.31), centerY + 0.14 * cos(uTime * 0.48));
    vec2 center16 = vec2(centerX + 0.17 * cos(uTime * 0.44), centerY + 0.18 * sin(uTime * 0.29));
    
    // Calculate metaball field with smaller radii for more distinct balls
    float v = 0.0;
    v += metaball(p, center1, 0.035); // Smaller radius for mouse-controlled metaball
    v += metaball(p, center2, 0.02);
    v += metaball(p, center3, 0.018);
    v += metaball(p, center4, 0.02);
    v += metaball(p, center5, 0.018);
    v += metaball(p, center6, 0.025);
    v += metaball(p, center7, 0.02);
    v += metaball(p, center8, 0.018);
    v += metaball(p, center9, 0.02);
    v += metaball(p, center10, 0.018);
    v += metaball(p, center11, 0.02);
    v += metaball(p, center12, 0.018);

    // Add the 4 extra metaballs with smaller radii
    v += metaball(p, center13, 0.025);
    v += metaball(p, center14, 0.02);
    v += metaball(p, center15, 0.028);
    v += metaball(p, center16, 0.022);
    
    // Adjust threshold and smoothness for a more gradual fade
    float threshold = 1.4;
    float smoothness = 1.2;
    
    // gradual fade with a wider smoothstep
    float metaballField = smoothstep(threshold - smoothness, threshold + 0.4, v);
    
    // a curve to create a more natural fade without hard edges
    metaballField = pow(metaballField, 1.2) * 0.8;
    
    // Output the brightness value directly - we'll convert to ASCII in JavaScript
    gl_FragColor = vec4(vec3(metaballField), 1.0);
  }
`,
    };

    // Create a plane that covers the entire viewport
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: metaballShader.uniforms,
      vertexShader: metaballShader.vertexShader,
      fragmentShader: metaballShader.fragmentShader,
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    // Handle mouse/touch movement
    const updatePointerPosition = (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (clientX - rect.left) / rect.width;
      const y = 1 - (clientY - rect.top) / rect.height;

      // Only update if pointer is within container
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        metaballShader.uniforms.uMouse.value.x = x;
        metaballShader.uniforms.uMouse.value.y = y;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      updatePointerPosition(event.clientX, event.clientY);
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        event.preventDefault(); // Prevent scrolling while dragging
        updatePointerPosition(
          event.touches[0].clientX,
          event.touches[0].clientY
        );
      }
    };

    // Only add event listeners if container is visible in viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries && entries.length > 0 && entries[0]?.isIntersecting) {
        window.addEventListener('mousemove', handleMouseMove, {
          passive: true,
        });
        window.addEventListener('touchmove', handleTouchMove, {
          passive: false,
        });
      } else {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;

      // Update dimensions state which will trigger re-render
      updateDimensions();

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Update renderer
      renderer.setSize(width, height);

      // Update shader uniforms
      metaballShader.uniforms.uResolution.value.set(width, height);
      metaballShader.uniforms.uAspect.value = width / height;

      // Resize ASCII canvas
      asciiCanvas.width = width;
      asciiCanvas.height = height;

      // Reset font size based on new dimensions
      if (asciiCtx) {
        const cellSize = Math.max(4, Math.floor(width / 160)); // Adjust cell size based on width
        asciiCtx.font = `${cellSize}px monospace`;
      }
    };

    // Add resize event listener with debounce
    let resizeTimeout: number;
    const debouncedResize = () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);

    // Make sure initial size is correct
    handleResize();

    // Define ASCII characters from darkest to brightest (simplified set)
    const asciiChars = ' .:-=+*#%@';

    // Set initial font size
    if (asciiCtx) {
      const cellSize = Math.max(4, Math.floor(dimensions.width / 160)); // Adjust cell size based on width
      asciiCtx.font = `${cellSize}px monospace`;
      asciiCtx.textBaseline = 'top';
    }

    // Animation loop
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      metaballShader.uniforms.uTime.value = elapsedTime;

      // Get current width and height for rendering
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = containerRef.current?.clientHeight || window.innerHeight;

      // Render the metaball field to the WebGL renderer
      renderer.render(scene, camera);

      // Get the pixel data from the renderer
      const gl = renderer.getContext();
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      // Clear the ASCII canvas
      if (asciiCtx) {
        asciiCtx.clearRect(0, 0, width, height);
        asciiCtx.fillStyle = 'black';
        asciiCtx.fillRect(0, 0, width, height);
        asciiCtx.fillStyle = 'white';

        // Calculate cell size based on canvas width
        const cellSize = Math.max(4, Math.floor(width / 160));
        const cols = Math.floor(width / cellSize);
        const rows = Math.floor(height / cellSize);

        // Draw ASCII characters based on brightness
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            // Sample the pixel at this position
            // Note: WebGL has (0,0) at bottom-left, canvas at top-left
            const pixelX = Math.floor(x * cellSize);
            const pixelY = height - Math.floor(y * cellSize) - 1;
            const pixelIndex = (pixelY * width + pixelX) * 4;

            // Get brightness from red channel (all channels are the same in our grayscale output)
            const brightness = pixels[pixelIndex] / 255;

            // Skip drawing if brightness is very low
            if (brightness < 0.05) continue;

            // Map brightness to ASCII character
            const charIndex = Math.floor(brightness * (asciiChars.length - 1));
            const char = asciiChars[charIndex];

            // Draw the character
            asciiCtx.fillText(char, x * cellSize, y * cellSize);
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', debouncedResize);
      window.clearTimeout(resizeTimeout);
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();

      if (containerRef.current) {
        try {
          if (asciiCanvas.parentNode === containerRef.current) {
            containerRef.current.removeChild(asciiCanvas);
          }
        } catch (e) {
          console.error('Error removing canvas:', e);
        }
      }

      geometry.dispose();
      material.dispose();
    };
  }, [dimensions.width, dimensions.height]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-screen bg-black touch-none cursor-pointer canvas-background"
      aria-label="Interactive metaballs experiment with ASCII rendering"
    />
  );
}
