'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CountryFlag from '@/components/CountryFlag';
import { calculateAllRiskProfiles, calculateRegionalStats, CountryRiskProfile, RegionalStats } from '@/lib/analysis';

// SVG Icons as components
const ChevronDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

const ExternalLinkIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6"/>
        <path d="M10 14 21 3"/>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
);

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
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

    const toggleRow = (country: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(country)) {
                newSet.delete(country);
            } else {
                newSet.add(country);
            }
            return newSet;
        });
    };

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
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 text-sm sm:text-base">Calculating risk profiles...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Risk & Stability Analysis</h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                        Composite risk indices aggregating economic, political, military, and demographic indicators
                    </p>
                </div>

                {/* Global Distribution - Scrollable on mobile */}
                <section className="mb-6 sm:mb-10">
                    <h2 className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Global Stability Distribution</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible">
                        {[
                            { label: 'Very Stable', count: distribution.veryHigh, color: '#059669', bg: 'bg-emerald-50 border-emerald-200' },
                            { label: 'Stable', count: distribution.high, color: '#65a30d', bg: 'bg-lime-50 border-lime-200' },
                            { label: 'Moderate', count: distribution.moderate, color: '#ca8a04', bg: 'bg-yellow-50 border-yellow-200' },
                            { label: 'At Risk', count: distribution.low, color: '#ea580c', bg: 'bg-orange-50 border-orange-200' },
                            { label: 'High Risk', count: distribution.veryLow, color: '#dc2626', bg: 'bg-red-50 border-red-200' },
                        ].map((item) => (
                            <div key={item.label} className={`p-3 sm:p-4 rounded-xl border ${item.bg} text-center flex-shrink-0 w-28 sm:w-auto`}>
                                <div className="text-2xl sm:text-3xl font-bold" style={{ color: item.color }}>
                                    {item.count}
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500 mt-1">{item.label}</div>
                                <div className="mt-2 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
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
                <section className="mb-6 sm:mb-10">
                    <h2 className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">Regional Stability Scores</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {regionalStats.map(stat => (
                            <button
                                key={stat.region}
                                onClick={() => setSelectedRegion(selectedRegion === stat.region ? null : stat.region)}
                                className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
                                    selectedRegion === stat.region
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-2 sm:mb-3">
                                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{stat.region}</h3>
                                    <ScoreBadge score={stat.avgRiskScore} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div>
                                        <span className="text-slate-500">Countries</span>
                                        <p className="text-slate-800 font-medium">{stat.countryCount}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Top Economy</span>
                                        <p className="text-slate-800 font-medium truncate">{stat.topEconomy}</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Avg Growth</span>
                                        <p className={`font-medium ${stat.avgGrowth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {stat.avgGrowth > 0 ? '+' : ''}{stat.avgGrowth.toFixed(1)}%
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Avg Military</span>
                                        <p className="text-slate-800 font-medium">{stat.avgMilitary.toFixed(1)}%</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Country Rankings */}
                <section>
                    <div className="flex flex-col gap-3 mb-4">
                        <h2 className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider">
                            {selectedRegion ? `${selectedRegion} Rankings` : 'Global Rankings'}
                            <span className="text-slate-400 font-normal ml-2 normal-case">({sortedProfiles.length})</span>
                        </h2>
                        
                        {/* Sort buttons - scrollable on mobile */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
                            <span className="text-slate-500 text-xs sm:text-sm whitespace-nowrap">Sort:</span>
                            {(['overall', 'economic', 'political', 'military', 'demographic'] as const).map(key => (
                                <button
                                    key={key}
                                    onClick={() => setSortBy(key)}
                                    className={`px-3 py-2 rounded-lg text-xs sm:text-sm capitalize transition whitespace-nowrap flex-shrink-0 ${
                                        sortBy === key
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
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
                            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 py-2"
                        >
                            ← Show all regions
                        </button>
                    )}

                    {/* Table - with mobile scroll */}
                    <div className="bg-white/90 rounded-xl border border-slate-200 overflow-hidden shadow-sm -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
                        <div className="overflow-x-auto table-scroll">
                            <table className="w-full min-w-[700px] sm:min-w-0">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="w-8 sm:w-10 py-3 px-2 sm:px-4"></th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm w-12">#</th>
                                        <th className="text-left py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm">Country</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm">Score</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm hidden md:table-cell">Econ</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm hidden md:table-cell">Pol</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm hidden lg:table-cell">Mil</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm hidden lg:table-cell">Demo</th>
                                        <th className="text-center py-3 px-2 sm:px-4 text-slate-500 font-medium text-xs sm:text-sm">Status</th>
                                        <th className="w-8 sm:w-10 py-3 px-2 sm:px-4"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedProfiles.map((profile, idx) => {
                                        const isExpanded = expandedRows.has(profile.country);
                                        const countryData = countries.find(c => c.country === profile.country);
                                        const slug = profile.country.toLowerCase().replace(/\s+/g, '_');

                                        return (
                                            <React.Fragment key={profile.country}>
                                                <tr 
                                                    className={`border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${
                                                        isExpanded ? 'bg-blue-50/50' : ''
                                                    }`}
                                                    onClick={() => toggleRow(profile.country)}
                                                >
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <button className="text-slate-400 hover:text-slate-600 transition p-1">
                                                            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-100 text-xs sm:text-sm font-medium text-slate-600">
                                                            {idx + 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <CountryFlag country={profile.country} size="md" />
                                                            <div>
                                                                <p className="font-medium text-slate-800 text-sm">{profile.country}</p>
                                                                <p className="text-xs text-slate-500">{profile.region}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center">
                                                        <ScoreCell score={profile.score.overall} highlight={sortBy === 'overall'} />
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                                                        <ScoreCell score={profile.score.economic} highlight={sortBy === 'economic'} />
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center hidden md:table-cell">
                                                        <ScoreCell score={profile.score.political} highlight={sortBy === 'political'} />
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center hidden lg:table-cell">
                                                        <ScoreCell score={profile.score.military} highlight={sortBy === 'military'} />
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center hidden lg:table-cell">
                                                        <ScoreCell score={profile.score.demographic} highlight={sortBy === 'demographic'} />
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4 text-center">
                                                        <span 
                                                            className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                                                            style={{ 
                                                                backgroundColor: `${profile.score.color}20`,
                                                                color: profile.score.color 
                                                            }}
                                                        >
                                                            {profile.score.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 sm:px-4">
                                                        <Link
                                                            href={`/countries/${slug}`}
                                                            className="text-blue-500 hover:text-blue-600 p-1 inline-block"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLinkIcon size={16} />
                                                        </Link>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && countryData && (
                                                    <tr key={`${profile.country}-details`} className="bg-slate-50">
                                                        <td colSpan={10} className="py-4 px-4 sm:px-8">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                                                                {/* Score Breakdown */}
                                                                <div className="col-span-2 space-y-2 sm:space-y-3">
                                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600">Score Breakdown</h4>
                                                                    <div className="space-y-2">
                                                                        <ScoreBar label="Economic" score={profile.score.economic} color="#10b981" weight="30%" />
                                                                        <ScoreBar label="Political" score={profile.score.political} color="#8b5cf6" weight="25%" />
                                                                        <ScoreBar label="Military" score={profile.score.military} color="#ef4444" weight="25%" />
                                                                        <ScoreBar label="Demographic" score={profile.score.demographic} color="#3b82f6" weight="20%" />
                                                                    </div>
                                                                </div>

                                                                {/* Key Metrics */}
                                                                <div className="space-y-2 sm:space-y-3">
                                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600">Economy</h4>
                                                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                                                        <DetailRow label="GDP" value={formatBillions(countryData.economy.gdp_ppp_billions)} />
                                                                        <DetailRow label="Growth" value={formatPercent(countryData.economy.gdp_growth_pct)} highlight={countryData.economy.gdp_growth_pct} />
                                                                        <DetailRow label="Inflation" value={formatPercent(countryData.economy.inflation_pct)} />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2 sm:space-y-3">
                                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600">Demographics</h4>
                                                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                                                        <DetailRow label="Pop." value={formatNumber(countryData.demographics.population)} />
                                                                        <DetailRow label="Growth" value={formatPercent(countryData.demographics.population_growth_pct)} highlight={countryData.demographics.population_growth_pct} />
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-2 sm:space-y-3">
                                                                    <h4 className="text-xs sm:text-sm font-medium text-slate-600">Military</h4>
                                                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                                                        <DetailRow label="% GDP" value={formatPercent(countryData.military.expenditure_pct_gdp)} />
                                                                        <DetailRow label="Unemp." value={formatPercent(countryData.economy.unemployment_pct)} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 pt-3 border-t border-slate-200">
                                                                <Link
                                                                    href={`/countries/${slug}`}
                                                                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 py-2"
                                                                >
                                                                    View full profile
                                                                    <ExternalLinkIcon size={14} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Methodology Link */}
                <div className="mt-6 sm:mt-10 p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-1 sm:mb-2 text-sm sm:text-base">Understanding the Risk Index</h3>
                            <p className="text-slate-500 text-xs sm:text-sm">
                                Our composite risk index aggregates multiple indicators across four dimensions: 
                                economic stability (30%), political risk (25%), military tension (25%), and 
                                demographic pressure (20%). Higher scores indicate greater stability.
                            </p>
                        </div>
                        <Link
                            href="/methodology#risk-index"
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition text-sm whitespace-nowrap self-start"
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
            className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold"
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
            className={`font-medium text-xs sm:text-base ${highlight ? 'sm:text-lg' : ''}`}
            style={{ color }}
        >
            {score}
        </span>
    );
}

function ScoreBar({ label, score, color, weight }: { label: string; score: number; color: string; weight: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-xs text-slate-400">{weight}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                            width: `${score}%`,
                            backgroundColor: color 
                        }}
                    />
                </div>
                <span className="text-xs font-medium w-6 sm:w-8 text-right" style={{ color }}>{score}</span>
            </div>
        </div>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: number }) {
    let colorClass = 'text-slate-800';
    if (highlight !== undefined) {
        colorClass = highlight > 0 ? 'text-emerald-600' : highlight < 0 ? 'text-red-600' : 'text-slate-800';
    }

    return (
        <div className="flex justify-between gap-2">
            <span className="text-slate-500">{label}</span>
            <span className={colorClass}>{value}</span>
        </div>
    );
}

function formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function formatBillions(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
    return `$${n.toFixed(0)}B`;
}

function formatPercent(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    return `${n.toFixed(1)}%`;
}
