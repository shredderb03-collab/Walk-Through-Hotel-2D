import React, { useEffect, useRef } from 'react';

export default function HubBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class for digital rain/motes
    class Particle {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      color: string;
      opacity: number;
      fadeSpeed: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedY = -(Math.random() * 0.4 + 0.1); // Move upwards slowly
        this.speedX = (Math.random() - 0.5) * 0.15;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.fadeSpeed = (Math.random() * 0.005) + 0.002;
        
        // emerald or teal colors
        const r = Math.random();
        if (r < 0.6) {
          this.color = `rgba(16, 185, 129, ${this.opacity})`; // emerald-500
        } else if (r < 0.9) {
          this.color = `rgba(20, 184, 166, ${this.opacity})`; // teal-500
        } else {
          this.color = `rgba(239, 68, 68, ${this.opacity})`; // subtle deep red spark
        }
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX;

        // Reset if goes off screen
        if (this.y < -10) {
          this.y = height + 10;
          this.x = Math.random() * width;
        }
        if (this.x < -10 || this.x > width + 10) {
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.shadowBlur = 8;
        c.shadowColor = this.color;
        c.fill();
        c.shadowBlur = 0; // Reset shadow for efficiency
      }
    }

    // Grid nodes
    const particles: Particle[] = Array.from({ length: 65 }, () => new Particle());

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    const render = () => {
      ctx.fillStyle = 'rgba(9, 9, 11, 0.15)'; // Deep dark tailwind zinc-950 with trail
      ctx.fillRect(0, 0, width, height);

      // Subtle horizontal scanline glow
      const time = Date.now() * 0.0005;
      const gradientY = (Math.sin(time) + 1) * 0.5 * height;
      const glowGrad = ctx.createLinearGradient(0, gradientY - 150, 0, gradientY + 150);
      glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)');
      glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="hub-bg-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none -z-20 bg-zinc-950"
    />
  );
}
