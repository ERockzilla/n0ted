/**
 * ---
 * route: /scratchpad
 * access: Navigation menu → 📝 icon (right side)
 * description: Quick notes scratchpad with localStorage persistence
 * features:
 *   - Ctrl+S to save manually
 *   - Auto-saves on blur
 *   - Word/line/character count
 *   - Clear button with confirmation
 * persistence: localStorage (browser-local, survives refresh)
 * ---
 */
'use client';

import Scratchpad from '../Scratchpad';

export default function ScratchpadPage() {
    return <Scratchpad />;
}

