import Link from 'next/link';
import { loadAllCountries } from '@/lib/data';
import InteractiveGlobe from '@/components/InteractiveGlobe';

export default function GlobePage() {
    const countries = loadAllCountries(2010);

    return (
        <div className="min-h-screen bg-black overflow-hidden flex flex-col">
            {/* Absolute Header Overlay */}
            <header className="absolute top-0 left-0 w-full z-50 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    <div>
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            🌍 GeoForecaster
                        </Link>
                        <p className="text-sm text-slate-300">Global GDP Visualization • 2010</p>
                    </div>
                    <nav className="flex gap-6">
                        <Link href="/" className="text-slate-300 hover:text-white transition shadow-black drop-shadow-md">Dashboard</Link>
                        <Link href="/countries" className="text-slate-300 hover:text-white transition shadow-black drop-shadow-md">Countries</Link>
                        <Link href="/globe" className="text-cyan-400 font-medium shadow-black drop-shadow-md">Globe 3D</Link>
                    </nav>
                </div>
            </header>

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
