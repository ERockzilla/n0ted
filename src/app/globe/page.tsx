import Link from 'next/link';
import { loadAllCountries } from '@/lib/data';
import InteractiveGlobe from '@/components/InteractiveGlobe';
import Navigation from '@/components/Navigation';

export default function GlobePage() {
    const countries = loadAllCountries(2010);

    return (
        <div className="min-h-screen bg-black overflow-hidden flex flex-col">
            <Navigation transparent />

            {/* Main Content */}
            <main className="flex-1 relative">
                <InteractiveGlobe countries={countries} />

                {/* Legend Overlay */}
                <div className="absolute bottom-8 left-8 p-4 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 max-w-xs pointer-events-none">
                    <h3 className="text-white font-semibold mb-2">Economic Power (GDP PPP)</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#00ff00] rounded"></div>
                            <span className="text-slate-200">Very High (&gt; $10T)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#88ff00] rounded"></div>
                            <span className="text-slate-200">High ($5T - $10T)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#ffff00] rounded"></div>
                            <span className="text-slate-200">Medium ($2T - $5T)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#ffaa00] rounded"></div>
                            <span className="text-slate-200">Low ($500B - $2T)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#ff4444] rounded"></div>
                            <span className="text-slate-200">Very Low (&lt; $500B)</span>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                        *Height of country represents GDP magnitude
                    </p>
                </div>
            </main>
        </div>
    );
}
