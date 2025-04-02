'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function ASCIILiquidBlob({
  children,
}: {
  children?: React.ReactNode;
}) {
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

    // Scene setup
    const scene = new THREE.Scene();

    // Use orthographic camera to cover the entire viewport without perspective distortion
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(
      dimensions.width || window.innerWidth,
      dimensions.height || window.innerHeight
    );
    renderer.setClearColor(0x000000, 0); // Transparent background
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5';
    containerRef.current.appendChild(renderer.domElement);

    // Create shader material for ASCII metaballs
    const asciiShader = {
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
        uCellSize: { value: 20.0 }, // ASCII cell size (20px)
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
        uniform float uCellSize;
        varying vec2 vUv;
        
        float metaball(vec2 p, vec2 center, float radius) {
          // Adjust x coordinate based on aspect ratio to maintain circular shape
          vec2 adjustedP = vec2(p.x * uAspect, p.y);
          vec2 adjustedCenter = vec2(center.x * uAspect, center.y);
          return radius / length(adjustedP - adjustedCenter);
        }
        
        // Function to determine the ASCII character based on brightness
        float getAsciiChar(float brightness) {
          // We'll use just two characters: space (invisible) and period (visible)
          return brightness < 0.05 ? 0.0 : 1.0;
        }
        
        void main() {
          // Calculate cell position (grid effect)
          vec2 cellSize = vec2(uCellSize) / uResolution;
          vec2 cellUv = floor(vUv / cellSize) * cellSize + cellSize * 0.5;
          
          vec2 p = cellUv; // Use cell center for metaball calculations
          
          // Calculate distance from center for edge fade
          vec2 center = vec2(0.5);
          float dist = length(p - center);
          float edgeFade = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Calculate metaballs in the central area
          float centerX = 0.5;
          float centerY = 0.5;
          
          // Add mouse magnetism effect - stronger attraction
          float magnetismStrength = 0.2;
          vec2 mouseInfluence = (uMouse - vec2(0.5)) * magnetismStrength;
          
          // Create metaball centers with mouse influence
          vec2 center1 = vec2(centerX + 0.12 * sin(uTime * 0.5) + mouseInfluence.x * 0.8, 
                             centerY + 0.12 * cos(uTime * 0.45) + mouseInfluence.y * 0.9);
          vec2 center2 = vec2(centerX + 0.14 * cos(uTime * 0.45) + mouseInfluence.x * 1.0, 
                             centerY + 0.14 * sin(uTime * 0.4) + mouseInfluence.y * 0.7);
          vec2 center3 = vec2(centerX + 0.11 * sin(uTime * 0.55) + mouseInfluence.x * 0.5, 
                             centerY + 0.15 * cos(uTime * 0.5) + mouseInfluence.y * 1.1);
          vec2 center4 = vec2(centerX + 0.16 * cos(uTime * 0.35) + mouseInfluence.x * 0.9, 
                             centerY + 0.13 * sin(uTime * 0.5) + mouseInfluence.y * 0.8);
          vec2 center5 = vec2(centerX + 0.13 * sin(uTime * 0.6) + mouseInfluence.x * 1.0, 
                             centerY + 0.15 * sin(uTime * 0.5) + mouseInfluence.y * 0.6);
          vec2 center6 = vec2(centerX + 0.15 * cos(uTime * 0.35) + mouseInfluence.x * 0.7, 
                             centerY + 0.14 * cos(uTime * 0.45) + mouseInfluence.y * 1.0);
          vec2 center7 = vec2(centerX + 0.12 * sin(uTime * 0.45) + mouseInfluence.x * 1.1, 
                             centerY + 0.11 * sin(uTime * 0.55) + mouseInfluence.y * 0.7);
          vec2 center8 = vec2(centerX + 0.14 * sin(uTime * 0.3) + mouseInfluence.x * 0.6, 
                             centerY + 0.13 * cos(uTime * 0.6) + mouseInfluence.y * 0.9);
          
          // Calculate metaball field with larger radii for bigger balls
          float v = 0.0;
          v += metaball(p, center1, 0.055);
          v += metaball(p, center2, 0.052);
          v += metaball(p, center3, 0.050);
          v += metaball(p, center4, 0.054);
          v += metaball(p, center5, 0.051);
          v += metaball(p, center6, 0.056);
          v += metaball(p, center7, 0.053);
          v += metaball(p, center8, 0.052);
          
          // Adjust threshold and smoothness for a more gradual fade
          float threshold = 1.4;
          float smoothness = 1.2;
          
          // Gradual fade with a wider smoothstep
          float metaballField = smoothstep(threshold - smoothness, threshold + 0.4, v);
          
          // Apply edge fade and create a curve for more natural fade without hard edges
          float brightness = pow(metaballField, 1.2) * 0.8 * edgeFade;
          
          // Determine if we should render a dot based on brightness
          float asciiChar = getAsciiChar(brightness);
          
          // Skip drawing (transparent) if not a visible character
          if (asciiChar < 0.5) {
            discard;
          }
          
          // Calculate grayscale color based on brightness (avoiding pure white)
          float grayValue = brightness * 0.8;
          vec3 finalColor = vec3(grayValue);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };

    // Create a plane that covers the entire viewport
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: asciiShader.uniforms,
      vertexShader: asciiShader.vertexShader,
      fragmentShader: asciiShader.fragmentShader,
      transparent: true,
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
        asciiShader.uniforms.uMouse.value.x = x;
        asciiShader.uniforms.uMouse.value.y = y;
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
      asciiShader.uniforms.uResolution.value.set(width, height);
      asciiShader.uniforms.uAspect.value = width / height;
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

    // Animation loop
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = (Date.now() - startTime) / 1000;
      asciiShader.uniforms.uTime.value = elapsedTime;

      // Render the ASCII metaball field
      renderer.render(scene, camera);

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
          if (renderer.domElement.parentNode === containerRef.current) {
            containerRef.current.removeChild(renderer.domElement);
          }
        } catch (e) {
          console.error('Error removing canvas elements:', e);
        }
      }

      geometry.dispose();
      material.dispose();
    };
  }, [dimensions.width, dimensions.height]);

  return (
    <div
      ref={containerRef}
      className="sticky inset-0 z-[-1] h-screen w-full touch-none cursor-pointer"
      aria-label="Interactive ASCII liquid blob effect. Move your mouse to influence the blob movement."
    >
      {children}
    </div>
  );
}
