'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// World currency symbols
const CURRENCY_SYMBOLS = [
    '$',  // US Dollar, AUD, CAD, etc.
    '€',  // Euro
    '£',  // British Pound
    '¥',  // Japanese Yen / Chinese Yuan
    '₹',  // Indian Rupee
    '₽',  // Russian Ruble
    '₩',  // South Korean Won
    '₿',  // Bitcoin
    '฿',  // Thai Baht
    '₫',  // Vietnamese Dong
    '₴',  // Ukrainian Hryvnia
    '₱',  // Philippine Peso
    '₦',  // Nigerian Naira
    '₪',  // Israeli Shekel
    '₨',  // Pakistani/Sri Lankan Rupee
    '₡',  // Costa Rican Colón
    '₲',  // Paraguayan Guaraní
    '₵',  // Ghanaian Cedi
    '₸',  // Kazakhstani Tenge
    '₺',  // Turkish Lira
    '₼',  // Azerbaijani Manat
    '₾',  // Georgian Lari
    '﷼',  // Saudi Riyal
    'ƒ',  // Dutch Guilder / Aruban Florin
    'kr', // Scandinavian Krone
    'zł', // Polish Zloty
    'Fr', // Swiss Franc
    'R$', // Brazilian Real
    'R',  // South African Rand
    '元', // Chinese Yuan (character)
    '円', // Japanese Yen (character)
    '원', // Korean Won (character)
];

type PatternType = 'vertical' | 'diagonal' | 'fibonacci' | 'sine' | 'spiral';

interface Stream {
    x: number;
    y: number;
    speed: number;
    symbols: string[];
    opacity: number;
    pattern: PatternType;
    phase: number;
    angle: number;
    radius: number;
    centerX: number;
    centerY: number;
    t: number;
}

const PHI = 1.618033988749895;

export default function MathBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamsRef = useRef<Stream[]>([]);
    const animationRef = useRef<number>(0);
    const pathname = usePathname();

    const isGlobePage = pathname === '/globe';

    useEffect(() => {
        if (isGlobePage) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const opacity = 0.08;
        const speed = 0.6;

        const patterns: PatternType[] = ['vertical', 'vertical', 'diagonal', 'fibonacci', 'sine', 'spiral'];

        const generateSymbols = (length: number): string[] => {
            return Array.from({ length }, () =>
                CURRENCY_SYMBOLS[Math.floor(Math.random() * CURRENCY_SYMBOLS.length)]
            );
        };

        const createStream = (): Stream => {
            const pattern = patterns[Math.floor(Math.random() * patterns.length)];
            const streamLength = 5 + Math.floor(Math.random() * 8);

            let x = Math.random() * canvas.width;
            let y = -100 - Math.random() * 300;
            let angle = 0;

            if (pattern === 'diagonal') {
                angle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 6 + Math.random() * Math.PI / 6);
                x = angle > 0 ? Math.random() * canvas.width * 0.3 : canvas.width * 0.7 + Math.random() * canvas.width * 0.3;
            } else if (pattern === 'spiral') {
                x = canvas.width / 2;
                y = canvas.height / 2;
            }

            return {
                x,
                y,
                speed: (0.3 + Math.random() * 0.8) * speed,
                symbols: generateSymbols(streamLength),
                opacity: 0.4 + Math.random() * 0.4,
                pattern,
                phase: Math.random() * Math.PI * 2,
                angle,
                radius: 20 + Math.random() * 50,
                centerX: canvas.width * (0.2 + Math.random() * 0.6),
                centerY: canvas.height * (0.2 + Math.random() * 0.6),
                t: 0,
            };
        };

        const initStreams = () => {
            const streamCount = Math.floor((canvas.width * canvas.height) / 20000);
            streamsRef.current = [];

            for (let i = 0; i < Math.min(streamCount, 50); i++) {
                const stream = createStream();
                if (stream.pattern !== 'spiral') {
                    stream.y = Math.random() * (canvas.height + 200) - 200;
                }
                stream.t = Math.random() * 10;
                streamsRef.current.push(stream);
            }
        };

        const updateSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            initStreams();
        };

        const getPosition = (stream: Stream, index: number): { x: number; y: number } => {
            const fontSize = 14;
            const spacing = fontSize * 1.3;

            switch (stream.pattern) {
                case 'vertical':
                    return { x: stream.x, y: stream.y + index * spacing };

                case 'diagonal':
                    return {
                        x: stream.x + Math.sin(stream.angle) * index * spacing,
                        y: stream.y + Math.cos(stream.angle) * index * spacing,
                    };

                case 'fibonacci': {
                    const n = stream.t + index * 0.3;
                    const r = Math.pow(PHI, n / Math.PI) * 5;
                    return {
                        x: stream.centerX + Math.cos(n) * r,
                        y: stream.centerY + Math.sin(n) * r,
                    };
                }

                case 'sine': {
                    const amplitude = 25 + Math.sin(stream.phase) * 15;
                    const frequency = 0.02;
                    const yPos = stream.y + index * spacing;
                    return {
                        x: stream.x + Math.sin(yPos * frequency + stream.phase) * amplitude,
                        y: yPos,
                    };
                }

                case 'spiral': {
                    const theta = stream.t + index * 0.5;
                    const r = stream.radius + theta * 3;
                    return {
                        x: stream.centerX + Math.cos(theta) * r,
                        y: stream.centerY + Math.sin(theta) * r,
                    };
                }

                default:
                    return { x: stream.x, y: stream.y + index * spacing };
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            const fontSize = 14;
            ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            streamsRef.current.forEach((stream, streamIdx) => {
                stream.symbols.forEach((symbol, i) => {
                    const pos = getPosition(stream, i);

                    if (pos.x < -50 || pos.x > window.innerWidth + 50 ||
                        pos.y < -50 || pos.y > window.innerHeight + 50) return;

                    const headFade = i === 0 ? 1.3 : 1;
                    const trailFade = 1 - (i / stream.symbols.length) * 0.7;
                    const alpha = stream.opacity * opacity * trailFade * headFade;

                    // Muted professional colors - slate/gray tones
                    let hue: number;
                    switch (stream.pattern) {
                        case 'fibonacci':
                            hue = 200; // Subtle blue
                            break;
                        case 'spiral':
                            hue = 210; // Steel blue
                            break;
                        case 'sine':
                            hue = 195; // Cyan-blue
                            break;
                        case 'diagonal':
                            hue = 205; // Light blue
                            break;
                        default:
                            hue = 200; // Slate blue
                    }

                    const saturation = i === 0 ? 25 : 20;
                    const lightness = i === 0 ? 60 : 50;

                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
                    ctx.fillText(symbol, pos.x, pos.y);

                    if (i === 0 && alpha > 0.05) {
                        ctx.shadowColor = `hsla(${hue}, 30%, 55%, ${alpha * 0.3})`;
                        ctx.shadowBlur = 4;
                        ctx.fillText(symbol, pos.x, pos.y);
                        ctx.shadowBlur = 0;
                    }
                });

                switch (stream.pattern) {
                    case 'vertical':
                    case 'sine':
                        stream.y += stream.speed;
                        break;
                    case 'diagonal':
                        stream.x += Math.sin(stream.angle) * stream.speed;
                        stream.y += Math.cos(stream.angle) * stream.speed;
                        break;
                    case 'fibonacci':
                    case 'spiral':
                        stream.t += stream.speed * 0.02;
                        break;
                }

                let needsReset = false;
                const lastPos = getPosition(stream, stream.symbols.length - 1);

                if (stream.pattern === 'fibonacci' || stream.pattern === 'spiral') {
                    needsReset = stream.t > 20;
                } else {
                    needsReset = lastPos.y > window.innerHeight + 100 ||
                        lastPos.x < -100 ||
                        lastPos.x > window.innerWidth + 100;
                }

                if (needsReset) {
                    streamsRef.current[streamIdx] = createStream();
                }

                if (Math.random() < 0.008) {
                    const idx = Math.floor(Math.random() * stream.symbols.length);
                    stream.symbols[idx] = CURRENCY_SYMBOLS[Math.floor(Math.random() * CURRENCY_SYMBOLS.length)];
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        animate();

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [isGlobePage]);

    if (isGlobePage) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            aria-hidden="true"
        />
    );
}
