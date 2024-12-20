import React, { useEffect, useRef } from 'react';

/**
 * Represents a single cell in the ASCII grid
 * @interface GridCell
 * @property {string} char - The character to display
 * @property {number} phase - The initial phase offset for animation
 * @property {number} speed - The speed modifier for the cell's animation
 */
interface GridCell {
  char: string;
  phase: number;
  speed: number;
}

/**
 * Represents a ripple effect in the grid
 * @interface Ripple
 * @property {number} x - Current X position
 * @property {number} y - Current Y position
 * @property {number} prevX - Previous X position (for motion trails)
 * @property {number} prevY - Previous Y position (for motion trails)
 * @property {number} radius - Current radius of the ripple
 * @property {number} strength - Intensity of the ripple effect
 * @property {number} age - How long the ripple has existed
 */
interface Ripple {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  radius: number;
  strength: number;
  age: number;
}

type Grid = GridCell[][];

const AsciiRipple: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const letters: string[] =
    "asbcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+-=[]{}|;':,.<>?/".split(
      ''
    );
  const fontSize = 12;
  const rippleRadius = 100;
  const rippleStrength = 0.4;
  const clickRippleStrength = 0.8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Creates the initial grid of characters
    // Each cell contains a random character, phase, and speed
    const initializeGrid = (width: number, height: number): Grid => {
      const cols = Math.ceil(width / fontSize);
      const rows = Math.ceil(height / fontSize);

      return Array(cols)
        .fill(null)
        .map(() =>
          Array(rows)
            .fill(null)
            .map(() => ({
              char: letters[Math.floor(Math.random() * letters.length)],
              phase: Math.random() * Math.PI * 2,
              speed: 0.5 + Math.random() * 0.5,
            }))
        );
    };

    // Checks if the current mouse/touch position is over a clickable link
    // Used to prevent ripple effects from interfering with navigation
    const isOverLink = (e: MouseEvent | TouchEvent): Element | null => {
      const element = document.elementFromPoint(
        'touches' in e ? e.touches[0].clientX : e.clientX,
        'touches' in e ? e.touches[0].clientY : e.clientY
      );
      return element?.closest('a') || null;
    };

    const handleLinkClick = (link: Element) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('mailto:')) return;
      window.location.href = href;
    };

    /**
     * Creates a new ripple effect at the specified coordinates
     * @param x - X coordinate of the ripple
     * @param y - Y coordinate of the ripple
     * @param isClick - Whether this ripple was triggered by a click/tap (stronger effect)
     */
    const createRipple = (
      x: number,
      y: number,
      isClick: boolean = false
    ): void => {
      const dx = x - lastMousePosRef.current.x;
      const dy = y - lastMousePosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Only create new ripples if there's been enough mouse movement or it's a click
      if (isClick || distance > 5) {
        ripplesRef.current.push({
          x,
          y,
          prevX: lastMousePosRef.current.x,
          prevY: lastMousePosRef.current.y,
          radius: 0,
          strength: isClick ? clickRippleStrength : rippleStrength,
          age: 0,
        });

        lastMousePosRef.current = { x, y };
      }
    };

    const handleMouseMove = (e: MouseEvent): void => {
      if (isOverLink(e)) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createRipple(x, y);
    };

    const handleClick = (e: MouseEvent): void => {
      const link = isOverLink(e);
      if (link) {
        handleLinkClick(link);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createRipple(x, y, true);
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (isOverLink(e)) return;

      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      createRipple(x, y);
    };

    const handleTouchStart = (e: TouchEvent): void => {
      const link = isOverLink(e);
      if (link) {
        handleLinkClick(link);
        return;
      }

      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      lastMousePosRef.current = { x, y };
      createRipple(x, y, true);
    };

    const handleResize = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      grid = initializeGrid(canvas.width, canvas.height);
    };

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let grid = initializeGrid(canvas.width, canvas.height);

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });

    const animate = (): void => {
      // Clear canvas
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px courier`;

      const cols = grid.length;
      const rows = grid[0].length;

      // Update ripples: increase radius, age them, and remove weak ones
      ripplesRef.current = ripplesRef.current.filter((ripple) => {
        ripple.radius += 5;
        ripple.age += 0.1;
        ripple.strength *= 0.95; // Fade out ripple over time
        return ripple.strength > 0.01; // Remove very weak ripples
      });

      // Update and render each character in the grid
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          const cell = grid[x][y];
          const posX = x * fontSize;
          const posY = y * fontSize;

          // Calculate displacement from all active ripples
          let displacement = 0;
          for (const ripple of ripplesRef.current) {
            const dx1 = posX - ripple.x;
            const dy1 = posY - ripple.y;
            const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

            const dx2 = posX - ripple.prevX;
            const dy2 = posY - ripple.prevY;
            const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

            // Apply ripple effect if character is within range
            if (
              distance1 < ripple.radius + rippleRadius ||
              distance2 < ripple.radius + rippleRadius
            ) {
              // Calculate wake effect using sine waves
              const wake =
                Math.sin(distance1 * 0.3 - ripple.age) *
                Math.sin(distance2 * 0.3 - ripple.age) *
                ripple.strength;
              displacement += wake;
            }
          }

          // Set character opacity based on displacement
          let opacity = 0.05; // Base opacity for static characters
          if (Math.abs(displacement) > 0.02) {
            opacity = Math.min(Math.abs(displacement) + 0.05, 0.5);
          }

          // Render character with displacement
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.fillText(
            cell.char,
            posX + displacement * 5,
            posY + fontSize + displacement * 5
          );
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 canvas-background touch-none pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AsciiRipple;
