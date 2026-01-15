'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { calculateAllRiskProfiles, calculateRegionalStats, CountryRiskProfile, RegionalStats } from '@/lib/analysis';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

export default function AnalysisPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [profiles, setProfiles] = useState<CountryRiskProfile[]>([]);
    const [regionalStats, setRegionalStats] = useState<RegionalStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'overall' | 'economic' | 'political' | 'military' | 'demographic'>('overall');

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                const countryPromises = data.countries.map((c: { file: string }) =>
                    fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
                );
                const allCountries = await Promise.all(countryPromises);
                const validCountries = allCountries.filter(Boolean) as CountryData[];
                setCountries(validCountries);
                
                const riskProfiles = calculateAllRiskProfiles(validCountries as any);
                setProfiles(riskProfiles);
                
                const stats = calculateRegionalStats(validCountries as any);
                setRegionalStats(stats);
                
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filteredProfiles = selectedRegion
        ? profiles.filter(p => p.region === selectedRegion)
        : profiles;

    const sortedProfiles = [...filteredProfiles].sort((a, b) => {
        return b.score[sortBy] - a.score[sortBy];
    });

    const regions = [...new Set(profiles.map(p => p.region))].sort();

    // Calculate distribution for histogram
    const distribution = {
        veryHigh: profiles.filter(p => p.score.overall >= 80).length,
        high: profiles.filter(p => p.score.overall >= 65 && p.score.overall < 80).length,
        moderate: profiles.filter(p => p.score.overall >= 45 && p.score.overall < 65).length,
        low: profiles.filter(p => p.score.overall >= 30 && p.score.overall < 45).length,
        veryLow: profiles.filter(p => p.score.overall < 30).length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Calculating risk profiles...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Risk & Stability Analysis</h1>
                    <p className="text-slate-400">
                        Composite risk indices aggregating economic, political, military, and demographic indicators
                    </p>
                </div>

                {/* Global Distribution */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-slate-300 mb-4">Global Stability Distribution</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {[
                            { label: 'Very Stable', count: distribution.veryHigh, color: '#22c55e', bg: 'bg-green-500/10 border-green-500/30' },
                            { label: 'Stable', count: distribution.high, color: '#84cc16', bg: 'bg-lime-500/10 border-lime-500/30' },
                            { label: 'Moderate', count: distribution.moderate, color: '#eab308', bg: 'bg-yellow-500/10 border-yellow-500/30' },
                            { label: 'At Risk', count: distribution.low, color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/30' },
                            { label: 'High Risk', count: distribution.veryLow, color: '#ef4444', bg: 'bg-red-500/10 border-red-500/30' },
                        ].map((item) => (
                            <div key={item.label} className={`p-4 rounded-xl border ${item.bg} text-center`}>
                                <div className="text-3xl font-bold" style={{ color: item.color }}>
                                    {item.count}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">{item.label}</div>
                                <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all"
                                        style={{ 
                                            backgroundColor: item.color,
                                            width: `${(item.count / profiles.length) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Regional Overview */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-slate-300 mb-4">Regional Stability Scores</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regionalStats.map(stat => (
                            <button
                                key={stat.region}
                                onClick={() => setSelectedRegion(selectedRegion === stat.region ? null : stat.region)}
                                className={`p-5 rounded-xl border text-left transition-all ${
                                    selectedRegion === stat.region
                                        ? 'border-cyan-500/50 bg-cyan-500/10'
                                        : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-white">{stat.region}</h3>
                                    <ScoreBadge score={stat.avgRiskScore} />
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-slate-500">Countries</span>
                                        <p className="text-white font-medium">{stat.countryCount}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Top Economy</span>
                                        <p className="text-white font-medium truncate">{stat.topEconomy}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Avg Growth</span>
                                        <p className={`font-medium ${stat.avgGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {stat.avgGrowth > 0 ? '+' : ''}{stat.avgGrowth.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Avg Military</span>
                                        <p className="text-white font-medium">{stat.avgMilitary.toFixed(1)}% GDP</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Country Rankings */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-semibold text-slate-300">
                            {selectedRegion ? `${selectedRegion} Rankings` : 'Global Rankings'}
                            <span className="text-slate-500 font-normal ml-2">({sortedProfiles.length} countries)</span>
                        </h2>
                        
                        <div className="flex gap-2 flex-wrap">
                            <span className="text-slate-500 text-sm self-center">Sort by:</span>
                            {(['overall', 'economic', 'political', 'military', 'demographic'] as const).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setSortBy(key)}
                                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${
                                        sortBy === key
                                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                            : 'bg-slate-700/50 text-slate-400 hover:text-white border border-transparent'
                                    }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedRegion && (
                        <button
                            onClick={() => setSelectedRegion(null)}
                            className="mb-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                            ← Show all regions
                        </button>
                    )}

                    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                        <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Rank</th>
                                        <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">Country</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Overall</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Economic</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Political</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Military</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Demographic</th>
                                        <th className="text-center py-4 px-4 text-slate-400 font-medium text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedProfiles.slice(0, 50).map((profile, idx) => (
                                        <tr 
                                            key={profile.country}
                                            className="border-b border-slate-700/30 hover:bg-slate-700/20 transition"
                                        >
                                            <td className="py-3 px-4">
                                                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 text-sm font-medium text-slate-300">
                                                    {idx + 1}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Link 
                                                    href={`/countries/${profile.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                    className="hover:text-cyan-400 transition"
                                                >
                                                    <p className="font-medium text-white">{profile.country}</p>
                                                    <p className="text-xs text-slate-500">{profile.region}</p>
                                                </Link>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <ScoreCell score={profile.score.overall} highlight={sortBy === 'overall'} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <ScoreCell score={profile.score.economic} highlight={sortBy === 'economic'} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <ScoreCell score={profile.score.political} highlight={sortBy === 'political'} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <ScoreCell score={profile.score.military} highlight={sortBy === 'military'} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <ScoreCell score={profile.score.demographic} highlight={sortBy === 'demographic'} />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span 
                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: `${profile.score.color}20`,
                                                        color: profile.score.color 
                                                    }}
                                                >
                                                    {profile.score.label}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {sortedProfiles.length > 50 && (
                        <p className="text-center text-slate-500 text-sm mt-4">
                            Showing top 50 of {sortedProfiles.length} countries
                        </p>
                    )}
                </section>

                {/* Methodology Link */}
                <div className="mt-10 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-white mb-2">Understanding the Risk Index</h3>
                            <p className="text-slate-400 text-sm max-w-2xl">
                                Our composite risk index aggregates multiple indicators across four dimensions: 
                                economic stability (30%), political risk (25%), military tension (25%), and 
                                demographic pressure (20%). Higher scores indicate greater stability.
                            </p>
                        </div>
                        <Link
                            href="/methodology#risk-index"
                            className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition text-sm whitespace-nowrap"
                        >
                            Learn More →
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 80 ? '#22c55e' : score >= 65 ? '#84cc16' : score >= 45 ? '#eab308' : score >= 30 ? '#f97316' : '#ef4444';
    
    return (
        <div 
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ backgroundColor: `${color}20`, color }}
        >
            {score}
        </div>
    );
}

function ScoreCell({ score, highlight }: { score: number; highlight?: boolean }) {
    const color = score >= 80 ? '#22c55e' : score >= 65 ? '#84cc16' : score >= 45 ? '#eab308' : score >= 30 ? '#f97316' : '#ef4444';
    
    return (
        <span 
            className={`font-medium ${highlight ? 'text-lg' : ''}`}
            style={{ color }}
        >
            {score}
        </span>
    );
}
