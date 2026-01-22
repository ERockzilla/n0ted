'use client';

import { useEffect } from 'react';
import { printConsoleIntro } from '@/lib/consoleIntro';

/**
 * Invisible component that triggers the console intro branding on app mount.
 * Shows ASCII globe and appreciation message in browser DevTools console.
 */
export default function ConsoleInit() {
    useEffect(() => {
        printConsoleIntro();
    }, []);

    return null;
}
