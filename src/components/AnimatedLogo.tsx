'use client';

import { useEffect, useRef } from 'react';

export default function AnimatedLogo({ size = 40 }: { size?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        let animationId: number;
        let rotation = 0;
        let breathPhase = 0;

        const centerX = size / 2;
        const centerY = size / 2;
        const baseRadius = size * 0.38;

        // Colors - professional blue tones
        const primaryColor = '59, 130, 246'; // blue-500
        const secondaryColor = '37, 99, 235'; // blue-600

        function drawLatitude(ctx: CanvasRenderingContext2D, lat: number, radius: number, alpha: number) {
            const y = Math.sin(lat) * radius;
            const latRadius = Math.cos(lat) * radius;
            
            if (latRadius > 0) {
                ctx.beginPath();
                ctx.ellipse(centerX, centerY + y, latRadius, latRadius * 0.3, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
                ctx.stroke();
            }
        }

        function drawLongitude(ctx: CanvasRenderingContext2D, lon: number, radius: number, alpha: number) {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(lon)), radius, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${primaryColor}, ${alpha})`;
            ctx.stroke();
        }

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, size, size);

            const breathScale = 1 + Math.sin(breathPhase) * 0.02;
            const radius = baseRadius * breathScale;

            // Subtle inner fill
            const innerGlow = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, radius
            );
            innerGlow.addColorStop(0, `rgba(${primaryColor}, 0.08)`);
            innerGlow.addColorStop(0.7, `rgba(${primaryColor}, 0.03)`);
            innerGlow.addColorStop(1, `rgba(${primaryColor}, 0)`);
            ctx.fillStyle = innerGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Grid wireframe globe
            ctx.lineWidth = 1;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);

            // Latitude lines
            const latCount = 4;
            for (let i = -latCount; i <= latCount; i++) {
                const lat = (i / latCount) * (Math.PI / 2) * 0.85;
                const alpha = 0.5 - Math.abs(i / latCount) * 0.25;
                drawLatitude(ctx, lat, radius, alpha);
            }

            // Longitude lines
            const lonCount = 6;
            for (let i = 0; i < lonCount; i++) {
                const lon = rotation * 2 + (i / lonCount) * Math.PI;
                const alpha = 0.35 + Math.cos(lon) * 0.15;
                drawLongitude(ctx, lon, radius, Math.max(0.15, alpha));
            }

            ctx.restore();

            // Outer ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${secondaryColor}, 0.6)`;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Highlight arc
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI * 0.8, -Math.PI * 0.2);
            const arcGradient = ctx.createLinearGradient(
                centerX - radius, centerY - radius,
                centerX, centerY
            );
            arcGradient.addColorStop(0, `rgba(${primaryColor}, 0.7)`);
            arcGradient.addColorStop(1, `rgba(${primaryColor}, 0.2)`);
            ctx.strokeStyle = arcGradient;
            ctx.lineWidth = 2;
            ctx.stroke();

            rotation += 0.006;
            breathPhase += 0.025;

            animationId = requestAnimationFrame(draw);
        }

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [size]);

    return (
        <canvas
            ref={canvasRef}
            style={{ width: size, height: size }}
            className="flex-shrink-0"
        />
    );
}
