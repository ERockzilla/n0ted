'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface TimeSeriesData {
    [country: string]: {
        [metric: string]: Array<{ year: number; value: number }>;
    };
}

const METRICS = [
    { key: 'population', label: 'Population', category: 'demographics', format: (v: number) => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : `${(v/1e6).toFixed(0)}M` },
    { key: 'gdp_ppp_billions', label: 'GDP (PPP)', category: 'economy', format: (v: number) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B` },
    { key: 'gdp_growth_pct', label: 'GDP Growth', category: 'economy', format: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
    { key: 'gdp_per_capita', label: 'GDP per Capita', category: 'economy', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'inflation_pct', label: 'Inflation', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'unemployment_pct', label: 'Unemployment', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'life_expectancy', label: 'Life Expectancy', category: 'demographics', format: (v: number) => `${v.toFixed(1)} yrs` },
    { key: 'expenditure_pct_gdp', label: 'Military % GDP', category: 'military', format: (v: number) => `${v.toFixed(1)}%` },
];

export default function TrendsPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([2010]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('gdp_ppp_billions');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/countries').then(r => r.json()),
            fetch('/api/countries/timeseries').then(r => r.json()).catch(() => null)
        ]).then(async ([indexData, tsData]) => {
            // Load all country data
            const countryPromises = indexData.countries.map((c: { file: string }) =>
                fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
            );
            const allCountries = await Promise.all(countryPromises);
            setCountries(allCountries.filter(Boolean));
            
            if (tsData && tsData.data) {
                setTimeSeriesData(tsData.data);
                // Extract available years from time series data
                const years = new Set<number>();
                Object.values(tsData.data).forEach((countryMetrics: any) => {
                    Object.values(countryMetrics).forEach((metricData: any) => {
                        metricData.forEach((point: { year: number }) => years.add(point.year));
                    });
                });
                setAvailableYears(Array.from(years).sort());
            }
            
            // Pre-select top 5 economies
            const top5 = allCountries
                .filter((c: any) => c?.economy?.gdp_ppp_billions)
                .sort((a: any, b: any) => (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0))
                .slice(0, 5)
                .map((c: any) => c.country);
            setSelectedCountries(top5);
            
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const metric = METRICS.find(m => m.key === selectedMetric)!;
    const hasMultiYearData = availableYears.length > 1;

    const toggleCountry = (country: string) => {
        setSelectedCountries(prev => {
            if (prev.includes(country)) {
                return prev.filter(c => c !== country);
            }
            if (prev.length >= 8) return prev;
            return [...prev, country];
        });
    };

    // Get data for selected countries and metric
    const chartData = selectedCountries.map(countryName => {
        const country = countries.find(c => c.country === countryName);
        if (!country) return null;

        // Check time series first
        const tsCountryData = timeSeriesData?.[countryName.toLowerCase()];
        if (tsCountryData && tsCountryData[selectedMetric]) {
            return {
                country: countryName,
                data: tsCountryData[selectedMetric]
            };
        }

        // Fall back to single-year data
        let value: number | undefined;
        if (metric.category === 'demographics') {
            value = country.demographics[selectedMetric];
        } else if (metric.category === 'economy') {
            value = country.economy[selectedMetric];
        } else if (metric.category === 'military') {
            value = country.military[selectedMetric];
        }

        if (value !== undefined) {
            return {
                country: countryName,
                data: [{ year: 2010, value }]
            };
        }
        return null;
    }).filter(Boolean);

    // Calculate max value for bar scaling
    const maxValue = Math.max(...chartData.map(d => d?.data[d.data.length - 1]?.value || 0));

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Loading trend data...</p>
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
                    <h1 className="text-3xl font-bold text-white mb-2">Trend Analysis</h1>
                    <p className="text-slate-400">
                        Compare country metrics over time
                        {!hasMultiYearData && ' • Single-year data currently loaded'}
                    </p>
                </div>

                {/* Multi-year data notice */}
                {!hasMultiYearData && (
                    <div className="mb-8 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-4">
                            <span className="text-2xl">📅</span>
                            <div>
                                <h3 className="font-semibold text-amber-400 mb-1">Single Year Data</h3>
                                <p className="text-slate-300 text-sm">
                                    Currently showing 2010 data only. For full time-series trend analysis, 
                                    ingest additional Factbook editions (2000, 2015, 2020) using the extraction scripts.
                                </p>
                                <Link
                                    href="/methodology#multi-year"
                                    className="inline-block mt-2 text-sm text-amber-400 hover:text-amber-300"
                                >
                                    Learn how to add more years →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar - Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Metric Selector */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">Metric</h3>
                            <div className="space-y-2">
                                {METRICS.map(m => (
                                    <button
                                        key={m.key}
                                        onClick={() => setSelectedMetric(m.key)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                                            selectedMetric === m.key
                                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                                : 'text-slate-300 hover:bg-slate-700/50'
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Country Selector */}
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
                                Countries ({selectedCountries.length}/8)
                            </h3>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                                {countries
                                    .sort((a, b) => a.country.localeCompare(b.country))
                                    .map(c => (
                                        <button
                                            key={c.country}
                                            onClick={() => toggleCountry(c.country)}
                                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                                                selectedCountries.includes(c.country)
                                                    ? 'bg-cyan-500/20 text-cyan-400'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                                            }`}
                                        >
                                            {c.country}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-white">{metric.label}</h2>
                                {hasMultiYearData && (
                                    <div className="flex gap-2">
                                        {availableYears.map(year => (
                                            <span key={year} className="px-3 py-1 bg-slate-700 rounded text-sm text-slate-300">
                                                {year}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {chartData.length === 0 ? (
                                <div className="text-center py-16">
                                    <span className="text-4xl">📊</span>
                                    <p className="text-slate-400 mt-4">Select countries to compare</p>
                                </div>
                            ) : hasMultiYearData ? (
                                // Multi-year line chart placeholder
                                <div className="space-y-4">
                                    {chartData.map((item: any) => (
                                        <div key={item.country} className="flex items-center gap-4">
                                            <div className="w-32 text-sm text-slate-300 truncate">{item.country}</div>
                                            <div className="flex-1 flex items-center gap-2">
                                                {item.data.map((point: any, idx: number) => (
                                                    <div key={point.year} className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-500">{point.year}:</span>
                                                        <span className="text-sm text-cyan-400">{metric.format(point.value)}</span>
                                                        {idx < item.data.length - 1 && (
                                                            <span className="text-slate-600 mx-2">→</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Single-year bar chart
                                <div className="space-y-4">
                                    {chartData
                                        .sort((a: any, b: any) => (b?.data[0]?.value || 0) - (a?.data[0]?.value || 0))
                                        .map((item: any, idx: number) => {
                                            const value = item.data[0]?.value || 0;
                                            const percentage = (value / maxValue) * 100;
                                            
                                            return (
                                                <div key={item.country} className="group">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Link 
                                                            href={`/countries/${item.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                            className="text-sm text-slate-300 hover:text-cyan-400 transition flex items-center gap-2"
                                                        >
                                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-700 text-xs">
                                                                {idx + 1}
                                                            </span>
                                                            {item.country}
                                                        </Link>
                                                        <span className="text-sm font-medium text-white">
                                                            {metric.format(value)}
                                                        </span>
                                                    </div>
                                                    <div className="h-6 bg-slate-700/50 rounded-lg overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-lg transition-all duration-500 ease-out"
                                                            style={{ 
                                                                width: `${percentage}%`,
                                                                background: `linear-gradient(90deg, #06b6d4, #3b82f6)`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            )}
                        </div>

                        {/* Year comparison table for single-year */}
                        {!hasMultiYearData && chartData.length > 0 && (
                            <div className="mt-6 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-700/50 bg-slate-900/50">
                                            <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Country</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">{metric.label}</th>
                                            <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Share of Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartData
                                            .sort((a: any, b: any) => (b?.data[0]?.value || 0) - (a?.data[0]?.value || 0))
                                            .map((item: any) => {
                                                const value = item.data[0]?.value || 0;
                                                const total = chartData.reduce((sum: number, d: any) => sum + (d?.data[0]?.value || 0), 0);
                                                const share = ((value / total) * 100).toFixed(1);
                                                
                                                return (
                                                    <tr key={item.country} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                                                        <td className="py-3 px-4 text-white">{item.country}</td>
                                                        <td className="py-3 px-4 text-right text-cyan-400 font-medium">{metric.format(value)}</td>
                                                        <td className="py-3 px-4 text-right text-slate-400">{share}%</td>
                                                    </tr>
                                                );
                                            })
                                        }
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
