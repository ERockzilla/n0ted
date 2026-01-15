import Link from 'next/link';
import { loadCountry, loadAllCountries, formatNumber, formatPercent, formatBillions } from '@/lib/data';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

import Navigation from '@/components/Navigation';
import { generateCountryInsights, Insight } from '@/lib/insights';
import { calculateRiskProfile } from '@/lib/analysis';

interface PageProps {
    params: Promise<{ slug: string }>;
}

export default async function CountryPage({ params }: PageProps) {
    const { slug } = await params;
    const filename = `${slug}.json`;
    const country = loadCountry(2010, filename);

    if (!country) {
        notFound();
    }

    // Load all countries for comparison/insights
    const allCountries = loadAllCountries(2010);
    
    // Generate insights
    const insights = generateCountryInsights(country, allCountries);
    
    // Calculate risk profile
    const riskProfile = calculateRiskProfile(country, allCountries);

    const d = country.demographics;
    const e = country.economy;
    const m = country.military;
    const p = country.political;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                    <Link href="/countries" className="hover:text-white transition">Countries</Link>
                    <span>/</span>
                    <Link href={`/regions/${encodeURIComponent(country.region.replace(/\s+/g, '_'))}`} className="hover:text-white transition">
                        {country.region}
                    </Link>
                    <span>/</span>
                    <span className="text-white">{country.country}</span>
                </div>

                {/* Title Section with Risk Score */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{country.country}</h1>
                        <p className="text-xl text-slate-400">{country.region} • {country.year}</p>
                    </div>
                    
                    {/* Risk Score Card */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="text-center">
                            <div 
                                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                                style={{ 
                                    borderColor: riskProfile.score.color,
                                    color: riskProfile.score.color 
                                }}
                            >
                                {riskProfile.score.overall}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Stability</p>
                        </div>
                        <div className="text-sm">
                            <p className="font-medium" style={{ color: riskProfile.score.color }}>
                                {riskProfile.score.label} Risk
                            </p>
                            <p className="text-slate-500">
                                #{riskProfile.rank} Global • #{riskProfile.regionalRank} in {country.region}
                            </p>
                            <Link 
                                href="/analysis" 
                                className="text-cyan-400 hover:text-cyan-300 text-xs"
                            >
                                View full analysis →
                            </Link>
                        </div>
                    </div>
                </div>

                {/* AI Insights */}
                {insights.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-slate-300 mb-4">💡 Key Insights</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {insights.map(insight => (
                                <InsightCard key={insight.id} insight={insight} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Political Leadership */}
                {(p.chief_of_state || p.head_of_government) && (
                    <section className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                        <h2 className="text-lg font-semibold text-purple-300 mb-4">🏛️ Political Leadership</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {p.chief_of_state && (
                                <div>
                                    <p className="text-sm text-slate-400">Chief of State</p>
                                    <p className="text-lg font-medium text-white">{p.chief_of_state}</p>
                                </div>
                            )}
                            {p.head_of_government && (
                                <div>
                                    <p className="text-sm text-slate-400">Head of Government</p>
                                    <p className="text-lg font-medium text-white">{p.head_of_government}</p>
                                </div>
                            )}
                            {p.last_election && (
                                <div>
                                    <p className="text-sm text-slate-400">Last Election</p>
                                    <p className="text-lg font-medium text-white">{p.last_election}</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Demographics */}
                    <section className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-emerald-400 mb-6">👥 Demographics</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <MetricCard label="Population" value={formatNumber(d.population)} />
                            <MetricCard label="Population Growth" value={formatPercent(d.population_growth_pct)} highlight={d.population_growth_pct} />
                            <MetricCard label="Life Expectancy" value={d.life_expectancy ? `${d.life_expectancy.toFixed(1)} years` : 'N/A'} />
                            <MetricCard label="Median Age" value={d.median_age ? `${d.median_age.toFixed(1)} years` : 'N/A'} />
                            <MetricCard label="Birth Rate" value={d.birth_rate ? `${d.birth_rate.toFixed(1)}/1000` : 'N/A'} />
                            <MetricCard label="Death Rate" value={d.death_rate ? `${d.death_rate.toFixed(1)}/1000` : 'N/A'} />
                        </div>
                    </section>

                    {/* Economy */}
                    <section className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-amber-400 mb-6">💰 Economy</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <MetricCard label="GDP (PPP)" value={formatBillions(e.gdp_ppp_billions)} large />
                            <MetricCard label="GDP Growth" value={formatPercent(e.gdp_growth_pct)} highlight={e.gdp_growth_pct} large />
                            <MetricCard label="GDP per Capita" value={e.gdp_per_capita ? `$${e.gdp_per_capita.toLocaleString()}` : 'N/A'} />
                            <MetricCard label="Inflation" value={formatPercent(e.inflation_pct)} highlight={e.inflation_pct ? -e.inflation_pct : undefined} />
                            <MetricCard label="Unemployment" value={formatPercent(e.unemployment_pct)} highlight={e.unemployment_pct ? -e.unemployment_pct : undefined} />
                            <MetricCard label="Poverty Rate" value={formatPercent(e.poverty_pct)} />
                        </div>
                    </section>

                    {/* Trade */}
                    <section className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-blue-400 mb-6">🚢 Trade & Finance</h2>
                        <div className="grid grid-cols-2 gap-6">
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
                            <MetricCard label="Current Account" value={formatBillions(e.current_account_billions)} />
                        </div>
                    </section>

                    {/* Energy & Military */}
                    <section className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                        <h2 className="text-lg font-semibold text-red-400 mb-6">⚡ Energy & Military</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <MetricCard label="Oil Production" value={e.oil_production_bbl_day ? `${e.oil_production_bbl_day.toLocaleString()} bbl/day` : 'N/A'} />
                            <MetricCard label="Oil Consumption" value={e.oil_consumption_bbl_day ? `${e.oil_consumption_bbl_day.toLocaleString()} bbl/day` : 'N/A'} />
                            <MetricCard label="Military Spending" value={formatPercent(m.expenditure_pct_gdp)} sublabel="% of GDP" />
                        </div>
                    </section>
                </div>

                {/* Risk Score Breakdown */}
                <section className="mt-8 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                    <h2 className="text-lg font-semibold text-slate-300 mb-6">📊 Stability Score Breakdown</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <ScoreBar label="Economic" score={riskProfile.score.economic} color="#10b981" />
                        <ScoreBar label="Political" score={riskProfile.score.political} color="#8b5cf6" />
                        <ScoreBar label="Military" score={riskProfile.score.military} color="#ef4444" />
                        <ScoreBar label="Demographic" score={riskProfile.score.demographic} color="#3b82f6" />
                    </div>
                </section>

                {/* Navigation Links */}
                <div className="mt-10 flex flex-wrap gap-4">
                    <Link
                        href="/countries"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
                    >
                        ← All Countries
                    </Link>
                    <Link
                        href={`/regions/${encodeURIComponent(country.region.replace(/\s+/g, '_'))}`}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
                    >
                        🗺️ {country.region}
                    </Link>
                    <Link
                        href="/compare"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                    >
                        ⚖️ Compare Countries
                    </Link>
                    <Link
                        href="/globe"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition"
                    >
                        🌍 View on Globe
                    </Link>
                </div>
            </main>
        </div>
    );
}

function InsightCard({ insight }: { insight: Insight }) {
    const typeColors = {
        positive: 'border-green-500/30 bg-green-500/5 text-green-400',
        negative: 'border-red-500/30 bg-red-500/5 text-red-400',
        neutral: 'border-slate-500/30 bg-slate-500/5 text-slate-300',
        warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    };

    return (
        <div className={`p-4 rounded-xl border ${typeColors[insight.type]}`}>
            <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{insight.icon}</span>
                <div className="min-w-0">
                    <h4 className="font-medium text-white text-sm">{insight.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{insight.description}</p>
                    {insight.metric && insight.value && (
                        <p className="text-xs mt-2">
                            <span className="text-slate-500">{insight.metric}:</span>{' '}
                            <span className="font-medium">{insight.value}</span>
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
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{label}</span>
                <span className="text-sm font-medium" style={{ color }}>{score}</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
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
    let colorClass = 'text-white';
    if (highlight !== undefined) {
        colorClass = highlight > 0 ? 'text-green-400' : highlight < 0 ? 'text-red-400' : 'text-white';
    }

    return (
        <div>
            <p className="text-sm text-slate-400">{label}</p>
            <p className={`${large ? 'text-2xl' : 'text-lg'} font-semibold ${colorClass}`}>
                {value}
            </p>
            {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
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
