'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { calculateAllRiskProfiles, CountryRiskProfile } from '@/lib/analysis';
import { generateRegionalInsights, Insight } from '@/lib/insights';
import LoadingSpinner from '@/components/LoadingSpinner';

// Custom SVG Icons (replacing Lucide)
const TrophyIcon = () => <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TargetIcon = () => <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><circle cx="12" cy="12" r="6" strokeWidth="2" /><circle cx="12" cy="12" r="2" strokeWidth="2" /></svg>;
const RocketIcon = () => <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const TrendDownIcon = () => <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
const ShieldIcon = () => <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AlertIcon = () => <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const MapIcon = () => <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const UsersIcon = () => <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const CheckIcon = () => <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

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

// Map insight icons to custom SVG components
const INSIGHT_ICONS: Record<string, React.ReactNode> = {
    '🏆': <TrophyIcon />,
    '📊': <TargetIcon />,
    '🚀': <RocketIcon />,
    '📉': <TrendDownIcon />,
    '⚔️': <ShieldIcon />,
    '⚠️': <AlertIcon />,
    '🌐': <MapIcon />,
    '👴': <UsersIcon />,
    '✅': <CheckIcon />,
};

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
            <div className="min-h-screen ">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <LoadingSpinner text="Loading regional data..." />
                </div>
            </div>
        );
    }

    if (countries.length === 0) {
        return (
            <div className="min-h-screen ">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <MapIcon />
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
        <div className="min-h-screen ">
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
                            icon={<UsersIcon />}
                            color="cyan"
                        />
                        <StatCard
                            label="Combined GDP"
                            value={formatGDP(totalGDP)}
                            icon={<svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            color="emerald"
                        />
                        <StatCard
                            label="Avg GDP Growth"
                            value={`${avgGrowth > 0 ? '+' : ''}${avgGrowth.toFixed(1)}%`}
                            icon={<svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                            color="amber"
                        />
                        <StatCard
                            label="Avg Stability"
                            value={`${Math.round(avgStability)}/100`}
                            icon={<TargetIcon />}
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
                                    className={`px-3 py-1.5 rounded-lg text-sm capitalize transition ${sortBy === key
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
                                    className="group p-5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition backdrop-blur-sm"
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
    icon: React.ReactNode;
    color: 'cyan' | 'emerald' | 'amber' | 'purple';
}) {
    const colorClasses = {
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    };

    return (
        <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-5 backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
                <div className="icon-animate">{icon}</div>
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

    const icon = INSIGHT_ICONS[insight.icon] || <TargetIcon />;

    return (
        <div className={`p-4 rounded-xl border ${typeColors[insight.type]} backdrop-blur-sm`}>
            <div className="flex items-start gap-3">
                <div className="icon-animate">{icon}</div>
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
