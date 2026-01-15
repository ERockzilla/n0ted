'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { calculateAllRiskProfiles, CountryRiskProfile } from '@/lib/analysis';
import { generateRegionalInsights, Insight } from '@/lib/insights';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

interface PageProps {
    params: Promise<{ region: string }>;
}

export default function RegionPage({ params }: PageProps) {
    const { region: regionSlug } = use(params);
    const regionName = decodeURIComponent(regionSlug).replace(/_/g, ' ');
    
    const [allCountries, setAllCountries] = useState<CountryData[]>([]);
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [profiles, setProfiles] = useState<CountryRiskProfile[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'gdp' | 'population' | 'growth' | 'stability'>('gdp');

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                const countryPromises = data.countries.map((c: { file: string }) =>
                    fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
                );
                const all = await Promise.all(countryPromises);
                const validCountries = all.filter(Boolean) as CountryData[];
                setAllCountries(validCountries);
                
                // Filter by region (case-insensitive match)
                const regional = validCountries.filter(c => 
                    c.region.toLowerCase() === regionName.toLowerCase()
                );
                setCountries(regional);
                
                // Calculate risk profiles for regional countries
                const allProfiles = calculateAllRiskProfiles(validCountries as any);
                const regionalProfiles = allProfiles.filter(p => 
                    p.region.toLowerCase() === regionName.toLowerCase()
                );
                setProfiles(regionalProfiles);
                
                // Generate regional insights
                const regionalInsights = generateRegionalInsights(regionName, validCountries as any);
                setInsights(regionalInsights);
                
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [regionName]);

    // Calculate regional aggregates
    const totalPopulation = countries.reduce((sum, c) => sum + (c.demographics.population || 0), 0);
    const totalGDP = countries.reduce((sum, c) => sum + (c.economy.gdp_ppp_billions || 0), 0);
    const growthRates = countries.filter(c => c.economy.gdp_growth_pct !== undefined).map(c => c.economy.gdp_growth_pct!);
    const avgGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
    const avgStability = profiles.length > 0 ? profiles.reduce((sum, p) => sum + p.score.overall, 0) / profiles.length : 0;

    // Sort countries
    const sortedCountries = [...countries].sort((a, b) => {
        switch (sortBy) {
            case 'gdp':
                return (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0);
            case 'population':
                return (b.demographics.population || 0) - (a.demographics.population || 0);
            case 'growth':
                return (b.economy.gdp_growth_pct || 0) - (a.economy.gdp_growth_pct || 0);
            case 'stability':
                const aProfile = profiles.find(p => p.country === a.country);
                const bProfile = profiles.find(p => p.country === b.country);
                return (bProfile?.score.overall || 0) - (aProfile?.score.overall || 0);
            default:
                return 0;
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading regional data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (countries.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <span className="text-6xl">🗺️</span>
                        <h1 className="text-2xl font-bold text-white mt-4">Region Not Found</h1>
                        <p className="text-slate-400 mt-2">No countries found for &quot;{regionName}&quot;</p>
                        <Link href="/countries" className="inline-block mt-6 px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition">
                            Browse All Countries
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Link href="/countries" className="hover:text-white transition">Countries</Link>
                    <span>/</span>
                    <span className="text-white">{regionName}</span>
                </div>

                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-4xl font-bold text-white mb-2">{regionName}</h1>
                    <p className="text-xl text-slate-400">{countries.length} countries • Regional Analysis</p>
                </div>

                {/* Key Stats */}
                <section className="mb-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Population"
                            value={formatLargeNumber(totalPopulation)}
                            icon="👥"
                            color="cyan"
                        />
                        <StatCard
                            label="Combined GDP"
                            value={formatGDP(totalGDP)}
                            icon="💰"
                            color="emerald"
                        />
                        <StatCard
                            label="Avg GDP Growth"
                            value={`${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`}
                            icon="📈"
                            color="amber"
                        />
                        <StatCard
                            label="Avg Stability"
                            value={`${Math.round(avgStability)}/100`}
                            icon="🎯"
                            color="purple"
                        />
                    </div>
                </section>

                {/* Insights */}
                {insights.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">Regional Insights</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Countries */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-300">Countries</h2>
                        <div className="flex gap-2">
                            {(['gdp', 'population', 'growth', 'stability'] as const).map(key => (
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

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedCountries.map((country, idx) => {
                            const profile = profiles.find(p => p.country === country.country);
                            
                            return (
                                <Link
                                    key={country.country}
                                    href={`/countries/${country.country.toLowerCase().replace(/\s+/g, '_')}`}
                                    className="group p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-300">
                                                {idx + 1}
                                            </span>
                                            <h3 className="font-semibold text-white group-hover:text-cyan-400 transition">
                                                {country.country}
                                            </h3>
                                        </div>
                                        {profile && (
                                            <span 
                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{ 
                                                    backgroundColor: `${profile.score.color}20`,
                                                    color: profile.score.color 
                                                }}
                                            >
                                                {profile.score.overall}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-500">GDP (PPP)</p>
                                            <p className="font-medium text-slate-200">{formatGDP(country.economy.gdp_ppp_billions)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Population</p>
                                            <p className="font-medium text-slate-200">{formatLargeNumber(country.demographics.population)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">GDP Growth</p>
                                            <p className={`font-medium ${(country.economy.gdp_growth_pct || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {country.economy.gdp_growth_pct !== undefined 
                                                    ? `${country.economy.gdp_growth_pct > 0 ? '+' : ''}${country.economy.gdp_growth_pct.toFixed(1)}%`
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Military</p>
                                            <p className="font-medium text-slate-200">
                                                {country.military.expenditure_pct_gdp !== undefined
                                                    ? `${country.military.expenditure_pct_gdp.toFixed(1)}% GDP`
                                                    : 'N/A'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Navigation */}
                <div className="flex gap-4 mt-10">
                    <Link
                        href="/countries"
                        className="px-5 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
                    >
                        ← All Countries
                    </Link>
                    <Link
                        href="/analysis"
                        className="px-5 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                    >
                        View Analysis →
                    </Link>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { 
    label: string; 
    value: string; 
    icon: string; 
    color: 'cyan' | 'emerald' | 'amber' | 'purple';
}) {
    const colorClasses = {
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    };

    return (
        <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-5`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-slate-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

function InsightCard({ insight }: { insight: Insight }) {
    const typeColors = {
        positive: 'border-green-500/30 bg-green-500/5',
        negative: 'border-red-500/30 bg-red-500/5',
        neutral: 'border-slate-500/30 bg-slate-500/5',
        warning: 'border-amber-500/30 bg-amber-500/5',
    };

    return (
        <div className={`p-4 rounded-xl border ${typeColors[insight.type]}`}>
            <div className="flex items-start gap-3">
                <span className="text-xl">{insight.icon}</span>
                <div>
                    <h4 className="font-medium text-white">{insight.title}</h4>
                    <p className="text-sm text-slate-400 mt-1">{insight.description}</p>
                    {insight.metric && insight.value && (
                        <p className="text-xs text-slate-500 mt-2">
                            {insight.metric}: <span className="text-slate-300">{insight.value}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatLargeNumber(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function formatGDP(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
    return `$${n.toFixed(0)}B`;
}
