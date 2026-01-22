/**
 * ---
 * purpose: Browser console branding for GeoForecaster
 * trigger: App mount (runs once per session)
 * view: Open browser DevTools (F12) → Console tab
 * ---
 */

const ASCII_GLOBE = `
              ░░░░░░░░░░░░░░░░░░░░░░
          ░░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░
       ░░▓▓▒▒░░░░▒▒▒▒▒▒▒▒░░░░▒▒▓▓░░
     ░░▓▓░░░░▒▒▓▓██████▓▓▒▒░░░░▓▓░░
    ░░▓░░░▒▓█████████████████▓░░░▓░░
   ░░▓░░▒███   ██████████   ███▒░░▓░░
   ░░▓░▒██       ██████       ██▒░▓░░
   ░░▓░▒██████████████████████▒░▓░░
    ░░▓░░▒██████████████████▒░░▓░░
     ░░▓▓░░░▒▒██████████▒▒░░░▓▓░░
       ░░▓▓▒▒░░░░▒▒▒▒░░░░▒▒▓▓░░
          ░░▒▒▓▓▓▓▓▓▓▓▓▓▒▒░░
              ░░░░░░░░░░░░░░
`;

const APPRECIATION_MESSAGE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🌍 GeoForecaster | Global Geopolitical Intelligence Platform

  "In a world of interconnected data, understanding
   global patterns is not just power—it's responsibility."

  Data sourced from CIA World Factbook archives (2000-2020)
  Statistical analysis powered by advanced regression models

  Thank you for exploring world data with curiosity and care.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

const TIPS = `💡 Quick tips:
   • /scratchpad  - Quick notes while researching
   • /compare     - Cross-country correlation discovery
   • /trends      - Forecasting with regression models
   • /analysis    - Risk & stability profiles`;

export function printConsoleIntro(): void {
    if (typeof window === 'undefined') return;

    // Only run once per session
    const hasRun = sessionStorage.getItem('geoforecaster_console_intro');
    if (hasRun) return;
    sessionStorage.setItem('geoforecaster_console_intro', 'true');

    // Print the ASCII globe with blue color
    console.log(
        '%c' + ASCII_GLOBE,
        'color: #3b82f6; font-family: monospace; font-size: 8px; line-height: 1.1;'
    );

    // Print the appreciation message
    console.log(
        '%c' + APPRECIATION_MESSAGE,
        'color: #64748b; font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; font-size: 11px; line-height: 1.5;'
    );

    // Print tips in green
    console.log(
        '%c' + TIPS,
        'color: #22c55e; font-size: 10px; line-height: 1.6; font-family: system-ui, sans-serif;'
    );
}

export default printConsoleIntro;
