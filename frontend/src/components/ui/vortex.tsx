import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useCallback } from "react";
import { createNoise3D } from "simplex-noise";
import { motion } from "framer-motion";

interface VortexProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  rangeY?: number;
  baseHue?: number;
  baseSpeed?: number;
  rangeSpeed?: number;
  baseRadius?: number;
  rangeRadius?: number;
  backgroundColor?: string;
}

export const Vortex = (props: VortexProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const noise3D = useRef(createNoise3D()).current;
  const particlePropsRef = useRef<Float32Array | null>(null);
  const tickRef = useRef(0);
  const centerRef = useRef<[number, number]>([0, 0]);

  const particleCount = props.particleCount || 700;
  const particlePropCount = 9;
  const particlePropsLength = particleCount * particlePropCount;
  const rangeY = props.rangeY || 100;
  const baseTTL = 50;
  const rangeTTL = 150;
  const baseSpeed = props.baseSpeed || 0.0;
  const rangeSpeed = props.rangeSpeed || 1.5;
  const baseRadius = props.baseRadius || 1;
  const rangeRadius = props.rangeRadius || 2;
  const baseHue = props.baseHue || 220;
  const rangeHue = 100;
  const noiseSteps = 3;
  const xOff = 0.00125;
  const yOff = 0.00125;
  const zOff = 0.0005;
  const backgroundColor = props.backgroundColor || "#000000";

  const TAU = 2 * Math.PI;
  const rand = (n: number) => n * Math.random();
  const randRange = (n: number) => n - rand(2 * n);
  const fadeInOut = (t: number, m: number) => {
    const hm = 0.5 * m;
    return Math.abs(((t + hm) % m) - hm) / hm;
  };
  const lerp = (n1: number, n2: number, speed: number) =>
    (1 - speed) * n1 + speed * n2;

  const initParticle = useCallback(
    (i: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !particlePropsRef.current) return;
      const x = rand(canvas.width);
      const y = centerRef.current[1] + randRange(rangeY);
      const life = 0;
      const ttl = baseTTL + rand(rangeTTL);
      const speed = baseSpeed + rand(rangeSpeed);
      const radius = baseRadius + rand(rangeRadius);
      const hue = baseHue + rand(rangeHue);
      particlePropsRef.current.set([x, y, 0, 0, life, ttl, speed, radius, hue], i);
    },
    [rangeY, baseTTL, rangeTTL, baseSpeed, rangeSpeed, baseRadius, rangeRadius, baseHue, rangeHue]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    particlePropsRef.current = new Float32Array(particlePropsLength);
    for (let i = 0; i < particlePropsLength; i += particlePropCount) {
      initParticle(i);
    }

    const resize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      centerRef.current = [0.5 * canvas.width, 0.5 * canvas.height];
    };

    resize();
    window.addEventListener("resize", resize);

    const checkBounds = (x: number, y: number) =>
      x > canvas.width || x < 0 || y > canvas.height || y < 0;

    const draw = () => {
      tickRef.current++;
      const pp = particlePropsRef.current;
      if (!pp) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Only fill with backgroundColor if it's not transparent
      if (backgroundColor && backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      for (let i = 0; i < particlePropsLength; i += particlePropCount) {
        const n =
          noise3D(pp[i] * xOff, pp[i + 1] * yOff, tickRef.current * zOff) *
          noiseSteps *
          TAU;
        const vx = lerp(pp[i + 2], Math.cos(n), 0.5);
        const vy = lerp(pp[i + 3], Math.sin(n), 0.5);
        const life = pp[i + 4];
        const ttl = pp[i + 5];
        const speed = pp[i + 6];
        const x2 = pp[i] + vx * speed;
        const y2 = pp[i + 1] + vy * speed;
        const radius = pp[i + 7];
        const hue = pp[i + 8];

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineWidth = radius;
        ctx.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
        ctx.beginPath();
        ctx.moveTo(pp[i], pp[i + 1]);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();

        pp[i] = x2;
        pp[i + 1] = y2;
        pp[i + 2] = vx;
        pp[i + 3] = vy;
        pp[i + 4] = life + 1;

        if (checkBounds(x2, y2) || life + 1 > ttl) initParticle(i);
      }

      ctx.save();
      ctx.filter = "blur(8px) brightness(200%)";
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.filter = "blur(4px) brightness(200%)";
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(canvas, 0, 0);
      ctx.restore();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [backgroundColor, initParticle, particlePropsLength, noise3D]);

  return (
    <div className={cn("relative h-full w-full", props.containerClassName)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        className="absolute inset-0 z-0 flex items-center justify-center bg-transparent"
      >
        <canvas ref={canvasRef} />
      </motion.div>
      <div className={cn("relative z-10", props.className)}>
        {props.children}
      </div>
    </div>
  );
};