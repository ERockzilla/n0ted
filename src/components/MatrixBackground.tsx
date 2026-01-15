'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// Currency symbols from countries around the world
const CURRENCY_SYMBOLS = [
    '$', '€', '£', '¥', '₹', '₽', '₩', '₿', '฿', '₫', '₴', '₺', 
    '₸', '₾', '₼', '₵', '₦', '₱', '₲', '₡', 'kr', 'zł', 'Kč', 
    'Ft', 'R$', '元', '円', '원', 'ƒ', '₳', '₠', '¢', '₯'
];

interface Drop {
    x: number;
    y: number;
    speed: number;
    chars: string[];
    opacity: number;
}

export default function MatrixBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const dropsRef = useRef<Drop[]>([]);
    const pathname = usePathname();
    const animationRef = useRef<number>();

    // Don't render on globe page
    const isGlobePage = pathname === '/globe';

    useEffect(() => {
        if (isGlobePage) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            
            // Reinitialize drops on resize
            initDrops();
        };

        const columnWidth = 30;
        
        function createDrop(x: number): Drop {
            const numChars = Math.floor(Math.random() * 15) + 8;
            const chars: string[] = [];
            for (let i = 0; i < numChars; i++) {
                chars.push(CURRENCY_SYMBOLS[Math.floor(Math.random() * CURRENCY_SYMBOLS.length)]);
            }
            return {
                x,
                y: -Math.random() * window.innerHeight * 0.5,
                speed: Math.random() * 2 + 1,
                chars,
                opacity: Math.random() * 0.5 + 0.5 // 0.5-1.0 opacity
            };
        }

        function initDrops() {
            const numColumns = Math.ceil(window.innerWidth / columnWidth);
            dropsRef.current = [];
            for (let i = 0; i < numColumns; i++) {
                if (Math.random() > 0.3) { // 70% chance to have a drop in each column
                    dropsRef.current.push(createDrop(i * columnWidth + columnWidth / 2));
                }
            }
        }

        function draw() {
            if (!ctx || !canvas) return;

            // Clear with semi-transparent dark to create trail effect
            ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            const fontSize = 16;
            ctx.font = `${fontSize}px "JetBrains Mono", "Fira Code", monospace`;
            ctx.textAlign = 'center';

            dropsRef.current.forEach((drop, index) => {
                drop.chars.forEach((char, charIdx) => {
                    const charY = drop.y - charIdx * fontSize * 1.2;
                    
                    if (charY > -fontSize && charY < window.innerHeight + fontSize) {
                        // Reset shadow
                        ctx.shadowBlur = 0;
                        ctx.shadowColor = 'transparent';
                        
                        if (charIdx === 0) {
                            // Head - brightest, glowing
                            ctx.fillStyle = `rgba(34, 211, 238, ${drop.opacity})`;
                            ctx.shadowColor = 'rgba(34, 211, 238, 0.9)';
                            ctx.shadowBlur = 15;
                        } else if (charIdx < 4) {
                            // Near head - bright cyan/teal
                            const alpha = drop.opacity * (1 - charIdx * 0.15);
                            ctx.fillStyle = `rgba(45, 212, 191, ${alpha})`;
                            ctx.shadowColor = 'rgba(45, 212, 191, 0.5)';
                            ctx.shadowBlur = 8;
                        } else {
                            // Tail - fading
                            const fadeRatio = Math.max(0, 1 - (charIdx - 3) / (drop.chars.length - 3));
                            const alpha = drop.opacity * fadeRatio * 0.6;
                            ctx.fillStyle = `rgba(20, 184, 166, ${Math.max(0.1, alpha)})`;
                        }

                        ctx.fillText(char, drop.x, charY);
                    }
                });

                // Reset shadow after each drop
                ctx.shadowBlur = 0;

                // Move drop down
                drop.y += drop.speed;

                // Randomly change a character
                if (Math.random() > 0.95) {
                    const changeIdx = Math.floor(Math.random() * drop.chars.length);
                    drop.chars[changeIdx] = CURRENCY_SYMBOLS[Math.floor(Math.random() * CURRENCY_SYMBOLS.length)];
                }

                // Reset drop when off screen
                if (drop.y > window.innerHeight + drop.chars.length * fontSize * 1.2) {
                    dropsRef.current[index] = createDrop(drop.x);
                }
            });

            // Occasionally add new drops
            const numColumns = Math.ceil(window.innerWidth / columnWidth);
            if (Math.random() > 0.95 && dropsRef.current.length < numColumns * 0.9) {
                const col = Math.floor(Math.random() * numColumns) * columnWidth + columnWidth / 2;
                const exists = dropsRef.current.some(d => Math.abs(d.x - col) < columnWidth / 2 && d.y < window.innerHeight * 0.3);
                if (!exists) {
                    dropsRef.current.push(createDrop(col));
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        }

        resize();
        window.addEventListener('resize', resize);
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isGlobePage]);

    if (isGlobePage) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[1]"
        />
    );
}
