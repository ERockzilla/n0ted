import Link from 'next/link';
import { loadCountry, loadAllCountries, formatNumber, formatPercent, formatBillions } from '@/lib/data';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

import Navigation from '@/components/Navigation';
import { generateCountryInsights, Insight } from '@/lib/insights';
import { calculateRiskProfile } from '@/lib/analysis';

// SVG Icons as components
const LightbulbIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
        <path d="M9 18h6"/><path d="M10 22h4"/>
    </svg>
);

const LandmarkIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
        <line x1="3" x2="21" y1="22" y2="22"/>
        <line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/>
        <line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
    </svg>
);

const UsersIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const CoinsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <circle cx="8" cy="8" r="6"/>
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/>
    </svg>
);

const ShipIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
        <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76"/>
        <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6"/><path d="M12 10v4"/>
    </svg>
);

const ZapIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
    </svg>
);

const BarChartIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>
    </svg>
);

const MapIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/>
    </svg>
);

const ScaleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
);

const GlobeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
        <path d="M2 12h20"/>
    </svg>
);

const TargetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Map insight icons to SVG components
const INSIGHT_ICONS: Record<string, React.ReactNode> = {
    '🏆': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    '📊': <BarChartIcon />,
    '🚀': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
    '📉': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>,
    '⚔️': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
    '🕊️': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>,
    '📦': <ShipIcon />,
    '⚠️': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
    '🌐': <GlobeIcon />,
    '👴': <UsersIcon />,
    '👶': <UsersIcon />,
    '✅': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
    '💎': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    '🌱': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
};

export default async function CountryPage({ params }: PageProps) {
    const { slug } = await params;
    const filename = `${slug}.json`;
    const country = loadCountry(2010, filename);

    if (!country) {
        notFound();
    }

    const allCountries = loadAllCountries(2010);
    const insights = generateCountryInsights(country, allCountries);
    const riskProfile = calculateRiskProfile(country, allCountries);

    const d = country.demographics;
    const e = country.economy;
    const m = country.military;
    const p = country.political;

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap pb-2">
                    <Link href="/countries" className="hover:text-blue-600 transition">Countries</Link>
                    <span>/</span>
                    <Link href={`/regions/${encodeURIComponent(country.region.replace(/\s+/g, '_'))}`} className="hover:text-blue-600 transition">
                        {country.region}
                    </Link>
                    <span>/</span>
                    <span className="text-slate-800 font-medium">{country.country}</span>
                </div>

                {/* Title Section with Risk Score */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-10">
                    <div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-1">{country.country}</h1>
                        <p className="text-base sm:text-xl text-slate-500">{country.region} • {country.year}</p>
                    </div>
                    
                    {/* Risk Score Card */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/80 border border-slate-200 shadow-sm self-start">
                        <div className="text-center">
                            <div 
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-4"
                                style={{ 
                                    borderColor: riskProfile.score.color,
                                    color: riskProfile.score.color 
                                }}
                            >
                                {riskProfile.score.overall}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Stability</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-medium" style={{ color: riskProfile.score.color }}>
                                {riskProfile.score.label} Risk
                            </p>
                            <p className="text-slate-500 text-xs sm:text-sm">
                                #{riskProfile.rank} Global • #{riskProfile.regionalRank} in {country.region}
                            </p>
                            <Link 
                                href="/analysis" 
                                className="text-blue-600 hover:text-blue-700 text-xs"
                            >
                                View full analysis →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* AI Insights - Scrollable on mobile */}
                {insights.length > 0 && (
                    <section className="mb-6 sm:mb-8">
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-700 mb-3 sm:mb-4 flex items-center gap-2">
                            <LightbulbIcon />
                            Key Insights
                        </h2>
                        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Political Leadership */}
                {(p.chief_of_state || p.head_of_government) && (
                    <section className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl bg-violet-50 border border-violet-200">
                        <h2 className="text-sm sm:text-lg font-semibold text-violet-700 mb-3 sm:mb-4 flex items-center gap-2">
                            <LandmarkIcon />
                            Political Leadership
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            {p.chief_of_state && (
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">Chief of State</p>
                                    <p className="text-sm sm:text-lg font-medium text-slate-800">{p.chief_of_state}</p>
                                </div>
                            )}
                            {p.head_of_government && (
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">Head of Government</p>
                                    <p className="text-sm sm:text-lg font-medium text-slate-800">{p.head_of_government}</p>
                                </div>
                            )}
                            {p.last_election && (
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-500">Last Election</p>
                                    <p className="text-sm sm:text-lg font-medium text-slate-800">{p.last_election}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                    {/* Demographics */}
                    <section className="p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                        <h2 className="text-sm sm:text-lg font-semibold text-emerald-600 mb-4 sm:mb-6 flex items-center gap-2">
                            <UsersIcon />
                            Demographics
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            <MetricCard label="Population" value={formatNumber(d.population)} />
                            <MetricCard label="Pop. Growth" value={formatPercent(d.population_growth_pct)} highlight={d.population_growth_pct} />
                            <MetricCard label="Life Expectancy" value={d.life_expectancy ? `${d.life_expectancy.toFixed(1)}y` : 'N/A'} />
                            <MetricCard label="Median Age" value={d.median_age ? `${d.median_age.toFixed(1)}y` : 'N/A'} />
                            <MetricCard label="Birth Rate" value={d.birth_rate ? `${d.birth_rate.toFixed(1)}/1000` : 'N/A'} />
                            <MetricCard label="Death Rate" value={d.death_rate ? `${d.death_rate.toFixed(1)}/1000` : 'N/A'} />
                        </div>
                    </section>

                    {/* Economy */}
                    <section className="p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                        <h2 className="text-sm sm:text-lg font-semibold text-amber-600 mb-4 sm:mb-6 flex items-center gap-2">
                            <CoinsIcon />
                            Economy
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            <MetricCard label="GDP (PPP)" value={formatBillions(e.gdp_ppp_billions)} large />
                            <MetricCard label="GDP Growth" value={formatPercent(e.gdp_growth_pct)} highlight={e.gdp_growth_pct} large />
                            <MetricCard label="Per Capita" value={e.gdp_per_capita ? `$${e.gdp_per_capita.toLocaleString()}` : 'N/A'} />
                            <MetricCard label="Inflation" value={formatPercent(e.inflation_pct)} highlight={e.inflation_pct ? -e.inflation_pct : undefined} />
                            <MetricCard label="Unemployment" value={formatPercent(e.unemployment_pct)} highlight={e.unemployment_pct ? -e.unemployment_pct : undefined} />
                            <MetricCard label="Poverty" value={formatPercent(e.poverty_pct)} />
                        </div>
                    </section>

                    {/* Trade */}
                    <section className="p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                        <h2 className="text-sm sm:text-lg font-semibold text-blue-600 mb-4 sm:mb-6 flex items-center gap-2">
                            <ShipIcon />
                            Trade & Finance
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            <MetricCard label="Exports" value={formatBillions(e.exports_billions)} />
                            <MetricCard label="Imports" value={formatBillions(e.imports_billions)} />
                            <MetricCard
                                label="Trade Balance"
                                value={e.exports_billions && e.imports_billions
                                    ? formatBillions(e.exports_billions - e.imports_billions)
                                    : 'N/A'
                                }
                                highlight={e.exports_billions && e.imports_billions ? e.exports_billions - e.imports_billions : undefined}
                            />
                            <MetricCard label="External Debt" value={formatBillions(e.external_debt_billions)} />
                        </div>
                    </section>

                    {/* Energy & Military */}
                    <section className="p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                        <h2 className="text-sm sm:text-lg font-semibold text-red-600 mb-4 sm:mb-6 flex items-center gap-2">
                            <ZapIcon />
                            Energy & Military
                        </h2>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            <MetricCard label="Oil Production" value={e.oil_production_bbl_day ? `${e.oil_production_bbl_day.toLocaleString()} bbl/d` : 'N/A'} />
                            <MetricCard label="Oil Consumption" value={e.oil_consumption_bbl_day ? `${e.oil_consumption_bbl_day.toLocaleString()} bbl/d` : 'N/A'} />
                            <MetricCard label="Military" value={formatPercent(m.expenditure_pct_gdp)} sublabel="% of GDP" />
                        </div>
                    </section>
                </div>

                {/* Risk Score Breakdown */}
                <section className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                    <h2 className="text-sm sm:text-lg font-semibold text-slate-700 mb-4 sm:mb-6 flex items-center gap-2">
                        <BarChartIcon />
                        Stability Score Breakdown
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <ScoreBar label="Economic" score={riskProfile.score.economic} color="#10b981" />
                        <ScoreBar label="Political" score={riskProfile.score.political} color="#8b5cf6" />
                        <ScoreBar label="Military" score={riskProfile.score.military} color="#ef4444" />
                        <ScoreBar label="Demographic" score={riskProfile.score.demographic} color="#3b82f6" />
                    </div>
                </section>

                {/* Navigation Links */}
                <div className="mt-6 sm:mt-10 flex flex-wrap gap-2 sm:gap-4">
                    <Link
                        href="/countries"
                        className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm"
                    >
                        ← All Countries
                    </Link>
                    <Link
                        href={`/regions/${encodeURIComponent(country.region.replace(/\s+/g, '_'))}`}
                        className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm"
                    >
                        <MapIcon />
                        {country.region}
                    </Link>
                    <Link
                        href="/compare"
                        className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition text-sm"
                    >
                        <ScaleIcon />
                        Compare
                    </Link>
                    <Link
                        href="/globe"
                        className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition text-sm"
                    >
                        <GlobeIcon />
                        Globe
                    </Link>
                </div>
            </main>
        </div>
    );
}

function InsightCard({ insight }: { insight: Insight }) {
    const typeColors = {
        positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        negative: 'border-red-200 bg-red-50 text-red-700',
        neutral: 'border-slate-200 bg-slate-50 text-slate-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
    };

    const icon = INSIGHT_ICONS[insight.icon] || <TargetIcon />;

    return (
        <div className={`p-3 sm:p-4 rounded-xl border ${typeColors[insight.type]} flex-shrink-0 w-64 sm:w-auto`}>
            <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div className="min-w-0">
                    <h4 className="font-medium text-slate-800 text-xs sm:text-sm">{insight.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{insight.description}</p>
                    {insight.metric && insight.value && (
                        <p className="text-xs mt-2">
                            <span className="text-slate-500">{insight.metric}:</span>{' '}
                            <span className="font-medium text-slate-700">{insight.value}</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1 sm:mb-2">
                <span className="text-xs sm:text-sm text-slate-500">{label}</span>
                <span className="text-xs sm:text-sm font-medium" style={{ color }}>{score}</span>
            </div>
            <div className="h-2 sm:h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                        width: `${score}%`,
                        backgroundColor: color 
                    }}
                />
            </div>
        </div>
    );
}

function MetricCard({
    label,
    value,
    sublabel,
    large = false,
    highlight
}: {
    label: string;
    value: string;
    sublabel?: string;
    large?: boolean;
    highlight?: number;
}) {
    let colorClass = 'text-slate-800';
    if (highlight !== undefined) {
        colorClass = highlight > 0 ? 'text-emerald-600' : highlight < 0 ? 'text-red-600' : 'text-slate-800';
    }

    return (
        <div>
            <p className="text-xs sm:text-sm text-slate-500">{label}</p>
            <p className={`${large ? 'text-lg sm:text-2xl' : 'text-sm sm:text-lg'} font-semibold ${colorClass}`}>
                {value}
            </p>
            {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
        </div>
    );
}

// Generate static paths for all countries
export async function generateStaticParams() {
    const dataDir = path.join(process.cwd(), 'data', '2010');
    try {
        const files = fs.readdirSync(dataDir);
        return files
            .filter(f => f.endsWith('.json') && f !== '_index.json')
            .map(f => ({ slug: f.replace('.json', '') }));
    } catch {
        return [];
    }
}
