'use client';

import { useState, useEffect } from 'react';
import InteractiveGlobe, { GlobeMetric, METRIC_CONFIG } from '@/components/InteractiveGlobe';
import Navigation from '@/components/Navigation';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

// SVG Icons
const CoinsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    </svg>
);

const UsersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    </svg>
);

const ShieldIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
    </svg>
);

const TrendingUpIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
);

const ShipIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
    </svg>
);

const LinkIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);

const METRIC_ICONS: Record<GlobeMetric, React.ReactNode> = {
    gdp: <CoinsIcon />,
    population: <UsersIcon />,
    military: <ShieldIcon />,
    growth: <TrendingUpIcon />,
    trade: <ShipIcon />
};

const METRIC_LEGENDS: Record<GlobeMetric, Array<{ color: string; label: string }>> = {
    gdp: [
        { color: '#22c55e', label: '> $10T' },
        { color: '#84cc16', label: '$3T - $10T' },
        { color: '#eab308', label: '$1T - $3T' },
        { color: '#f97316', label: '$200B - $1T' },
        { color: '#ef4444', label: '< $200B' },
    ],
    population: [
        { color: '#06b6d4', label: '> 500M' },
        { color: '#3b82f6', label: '100M - 500M' },
        { color: '#6366f1', label: '50M - 100M' },
        { color: '#8b5cf6', label: '10M - 50M' },
        { color: '#a855f7', label: '< 10M' },
    ],
    military: [
        { color: '#dc2626', label: '> 10% GDP' },
        { color: '#f87171', label: '5% - 10%' },
        { color: '#fb923c', label: '3% - 5%' },
        { color: '#facc15', label: '1% - 3%' },
        { color: '#22d3ee', label: '< 1%' },
    ],
    growth: [
        { color: '#22c55e', label: '> 10%' },
        { color: '#a3e635', label: '5% - 10%' },
        { color: '#fbbf24', label: '0% - 5%' },
        { color: '#f97316', label: '-5% - 0%' },
        { color: '#dc2626', label: '< -5%' },
    ],
    trade: [
        { color: '#22c55e', label: 'Large Surplus' },
        { color: '#84cc16', label: 'Surplus' },
        { color: '#fbbf24', label: 'Balanced' },
        { color: '#f97316', label: 'Deficit' },
        { color: '#dc2626', label: 'Large Deficit' },
    ],
};

export default function GlobePage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [activeMetric, setActiveMetric] = useState<GlobeMetric>('gdp');
    const [showArcs, setShowArcs] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                const countryPromises = data.countries.map((c: { file: string }) =>
                    fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
                );
                const allCountries = await Promise.all(countryPromises);
                setCountries(allCountries.filter(Boolean));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const config = METRIC_CONFIG[activeMetric];
    const legend = METRIC_LEGENDS[activeMetric];

    return (
        <div className="min-h-screen bg-slate-900 overflow-hidden flex flex-col">
            <Navigation transparent />

            <main className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400 text-sm sm:text-base">Loading globe data...</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-[calc(100vh-80px)]">
                        <InteractiveGlobe 
                            countries={countries as any} 
                            activeMetric={activeMetric}
                            showArcs={showArcs}
                        />
                    </div>
                )}

                {/* Mobile Controls Toggle */}
                <button
                    onClick={() => setShowControls(!showControls)}
                    className="sm:hidden absolute top-20 right-4 z-20 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 px-4 py-2 shadow-xl text-white text-sm flex items-center gap-2"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
                    </svg>
                    Controls
                </button>

                {/* Metric Selector Panel */}
                <div className={`absolute sm:top-24 sm:right-6 z-10 ${showControls ? 'top-32 right-4 left-4' : 'hidden sm:block'}`}>
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 p-3 sm:p-4 shadow-2xl">
                        <h3 className="text-xs sm:text-sm font-medium text-slate-400 mb-2 sm:mb-3 uppercase tracking-wider">Visualization</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2">
                            {(Object.keys(METRIC_CONFIG) as GlobeMetric[]).map((metric) => (
                                <button
                                    key={metric}
                                    onClick={() => {
                                        setActiveMetric(metric);
                                        setShowControls(false);
                                    }}
                                    className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-left transition-all ${
                                        activeMetric === metric
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <span>{METRIC_ICONS[metric]}</span>
                                    <span className="font-medium text-xs sm:text-sm">{METRIC_CONFIG[metric].label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Trade Arcs Toggle */}
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-700/50">
                            <button
                                onClick={() => {
                                    setShowArcs(!showArcs);
                                    setShowControls(false);
                                }}
                                className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-left transition-all ${
                                    showArcs
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                                }`}
                            >
                                <span className={showArcs ? 'text-blue-400' : 'text-slate-400'}><LinkIcon /></span>
                                <span className="font-medium text-xs sm:text-sm">Trade Arcs</span>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${showArcs ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                                    {showArcs ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend Panel - Bottom on mobile, left on desktop */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-auto z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 p-4 sm:p-5 shadow-2xl sm:max-w-xs">
                        <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            <span>{METRIC_ICONS[activeMetric]}</span>
                            <h3 className="text-white font-semibold text-sm sm:text-base">{config.label}</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2">
                            {legend.map((item, i) => (
                                <div key={i} className="flex items-center gap-2 sm:gap-3">
                                    <div 
                                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-md shadow-inner flex-shrink-0" 
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs sm:text-sm text-slate-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                            Height = magnitude • Tap country for details
                        </p>
                    </div>
                </div>

                {/* Data Year Badge */}
                <div className="absolute top-20 left-4 sm:top-24 sm:left-6 z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 px-3 py-2 sm:px-4 sm:py-3 shadow-xl">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Data</p>
                        <p className="text-xl sm:text-2xl font-bold text-white">2010</p>
                        <p className="text-xs text-slate-400 hidden sm:block mt-1">CIA Factbook</p>
                    </div>
                </div>

                {/* Touch hint for mobile */}
                <div className="sm:hidden absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-center">
                    <p className="text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Pinch to zoom • Drag to rotate
                    </p>
                </div>
            </main>
        </div>
    );
}
