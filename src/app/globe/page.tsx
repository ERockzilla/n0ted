'use client';

import { useState, useEffect } from 'react';
import InteractiveGlobe, { GlobeMetric, METRIC_CONFIG } from '@/components/InteractiveGlobe';
import Navigation from '@/components/Navigation';
import { Coins, Users, Shield, TrendingUp, Ship, Link2 } from 'lucide-react';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

const METRIC_ICONS: Record<GlobeMetric, React.ReactNode> = {
    gdp: <Coins size={18} className="text-amber-400" />,
    population: <Users size={18} className="text-purple-400" />,
    military: <Shield size={18} className="text-red-400" />,
    growth: <TrendingUp size={18} className="text-green-400" />,
    trade: <Ship size={18} className="text-blue-400" />
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

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                // Load all country data
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
        <div className="min-h-screen bg-black overflow-hidden flex flex-col">
            <Navigation transparent />

            <main className="flex-1 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400">Loading globe data...</p>
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

                {/* Metric Selector Panel */}
                <div className="absolute top-24 right-6 z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 p-4 shadow-2xl">
                        <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Visualization</h3>
                        <div className="space-y-2">
                            {(Object.keys(METRIC_CONFIG) as GlobeMetric[]).map((metric) => (
                                <button
                                    key={metric}
                                    onClick={() => setActiveMetric(metric)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                                        activeMetric === metric
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <span className="icon-animate">{METRIC_ICONS[metric]}</span>
                                    <span className="font-medium">{METRIC_CONFIG[metric].label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Trade Arcs Toggle */}
                        <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <button
                                onClick={() => setShowArcs(!showArcs)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all ${
                                    showArcs
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                                }`}
                            >
                                <Link2 size={18} className={showArcs ? 'text-blue-400' : 'text-slate-400'} />
                                <span className="font-medium">Trade Arcs</span>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${showArcs ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700 text-slate-400'}`}>
                                    {showArcs ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend Panel */}
                <div className="absolute bottom-8 left-8 z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 shadow-2xl max-w-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="icon-animate">{METRIC_ICONS[activeMetric]}</span>
                            <h3 className="text-white font-semibold">{config.label}</h3>
                        </div>
                        <div className="space-y-2">
                            {legend.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div 
                                        className="w-5 h-5 rounded-md shadow-inner" 
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-slate-300">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
                            Height represents magnitude • Click country for details
                        </p>
                    </div>
                </div>

                {/* Data Year Badge */}
                <div className="absolute top-24 left-6 z-10">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/50 px-4 py-3 shadow-xl">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Data Year</p>
                        <p className="text-2xl font-bold text-white">2010</p>
                        <p className="text-xs text-slate-400 mt-1">CIA World Factbook</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
