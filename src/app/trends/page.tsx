'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

// SVG Icons
const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/>
    </svg>
);

const BarChartIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
        <path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>
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

interface TimeSeriesData {
    [country: string]: {
        [metric: string]: Array<{ year: number; value: number }>;
    };
}

const METRICS = [
    { key: 'population', label: 'Population', category: 'demographics', format: (v: number) => v >= 1e9 ? `${(v/1e9).toFixed(1)}B` : `${(v/1e6).toFixed(0)}M` },
    { key: 'gdp_ppp_billions', label: 'GDP (PPP)', category: 'economy', format: (v: number) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B` },
    { key: 'gdp_growth_pct', label: 'GDP Growth', category: 'economy', format: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%` },
    { key: 'gdp_per_capita', label: 'Per Capita', category: 'economy', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'inflation_pct', label: 'Inflation', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'unemployment_pct', label: 'Unemployment', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'life_expectancy', label: 'Life Exp.', category: 'demographics', format: (v: number) => `${v.toFixed(1)}y` },
    { key: 'expenditure_pct_gdp', label: 'Military %', category: 'military', format: (v: number) => `${v.toFixed(1)}%` },
];

export default function TrendsPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
    const [availableYears, setAvailableYears] = useState<number[]>([2010]);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('gdp_ppp_billions');
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/countries').then(r => r.json()),
            fetch('/api/countries/timeseries').then(r => r.json()).catch(() => null)
        ]).then(async ([indexData, tsData]) => {
            const countryPromises = indexData.countries.map((c: { file: string }) =>
                fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
            );
            const allCountries = await Promise.all(countryPromises);
            setCountries(allCountries.filter(Boolean));
            
            if (tsData && tsData.data) {
                setTimeSeriesData(tsData.data);
                const years = new Set<number>();
                Object.values(tsData.data).forEach((countryMetrics: any) => {
                    Object.values(countryMetrics).forEach((metricData: any) => {
                        metricData.forEach((point: { year: number }) => years.add(point.year));
                    });
                });
                setAvailableYears(Array.from(years).sort());
            }
            
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

    const chartData = selectedCountries.map(countryName => {
        const country = countries.find(c => c.country === countryName);
        if (!country) return null;

        const tsCountryData = timeSeriesData?.[countryName.toLowerCase()];
        if (tsCountryData && tsCountryData[selectedMetric]) {
            return {
                country: countryName,
                data: tsCountryData[selectedMetric]
            };
        }

        const category = metric.category as 'demographics' | 'economy' | 'military';
        const value = country[category]?.[selectedMetric];
        if (value === undefined) return null;

        return {
            country: countryName,
            data: [{ year: country.year, value }]
        };
    }).filter(Boolean);

    const maxValue = Math.max(...chartData.map((d: any) => Math.max(...d.data.map((p: any) => p.value))));

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 text-sm sm:text-base">Loading trend data...</p>
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Trend Analysis</h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                        Compare country metrics over time
                        {!hasMultiYearData && ' • Single-year data currently loaded'}
                    </p>
                </div>

                {/* Multi-year data notice */}
                {!hasMultiYearData && (
                    <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex-shrink-0"><CalendarIcon /></div>
                            <div>
                                <h3 className="font-semibold text-amber-700 mb-1 text-sm sm:text-base">Single Year Data</h3>
                                <p className="text-slate-600 text-xs sm:text-sm">
                                    Currently showing 2010 data only. For full time-series trend analysis, 
                                    ingest additional Factbook editions using the extraction scripts.
                                </p>
                                <Link
                                    href="/methodology#multi-year"
                                    className="inline-block mt-2 text-xs sm:text-sm text-amber-600 hover:text-amber-700"
                                >
                                    Learn how to add more years →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Metric Selector - Scrollable on mobile */}
                <div className="mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 sm:mb-3">Metric</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                        {METRICS.map(m => (
                            <button
                                key={m.key}
                                onClick={() => setSelectedMetric(m.key)}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition whitespace-nowrap flex-shrink-0 ${
                                    selectedMetric === m.key
                                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                }`}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Country selector toggle for mobile */}
                <div className="mb-4 sm:hidden">
                    <button
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm flex items-center justify-between"
                    >
                        <span>Countries ({selectedCountries.length}/8)</span>
                        <svg 
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className={`transition-transform ${showCountryPicker ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6"/>
                        </svg>
                    </button>
                    
                    {showCountryPicker && (
                        <div className="mt-2 p-3 rounded-xl bg-white border border-slate-200 max-h-48 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                                {countries
                                    .sort((a, b) => a.country.localeCompare(b.country))
                                    .map(c => (
                                        <button
                                            key={c.country}
                                            onClick={() => toggleCountry(c.country)}
                                            className={`px-2 py-1 rounded text-xs transition ${
                                                selectedCountries.includes(c.country)
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {c.country}
                                        </button>
                                    ))
                                }
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
                    {/* Sidebar - Country Selector (desktop only) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="bg-white/80 rounded-xl border border-slate-200 p-4 sm:p-5 sticky top-24">
                            <h3 className="text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                                Countries ({selectedCountries.length}/8)
                            </h3>
                            <div className="max-h-80 overflow-y-auto space-y-1">
                                {countries
                                    .sort((a, b) => a.country.localeCompare(b.country))
                                    .map(c => (
                                        <button
                                            key={c.country}
                                            onClick={() => toggleCountry(c.country)}
                                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition ${
                                                selectedCountries.includes(c.country)
                                                    ? 'bg-blue-50 text-blue-600'
                                                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
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
                        <div className="bg-white/80 rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-lg sm:text-xl font-semibold text-slate-800">{metric.label}</h2>
                                {hasMultiYearData && (
                                    <div className="flex gap-2">
                                        {availableYears.map(year => (
                                            <span key={year} className="px-2 py-1 bg-slate-100 rounded text-xs sm:text-sm text-slate-600">
                                                {year}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {chartData.length === 0 ? (
                                <div className="text-center py-12 sm:py-16">
                                    <div className="flex justify-center"><BarChartIcon /></div>
                                    <p className="text-slate-500 mt-4 text-sm sm:text-base">Select countries to compare</p>
                                </div>
                            ) : hasMultiYearData ? (
                                <div className="space-y-3 sm:space-y-4">
                                    {chartData.map((item: any) => (
                                        <div key={item.country} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                            <div className="text-sm text-slate-700 font-medium sm:w-32 sm:truncate">{item.country}</div>
                                            <div className="flex-1 flex items-center gap-2 flex-wrap">
                                                {item.data.map((point: any, idx: number) => (
                                                    <div key={point.year} className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-500">{point.year}:</span>
                                                        <span className="text-sm text-blue-600">{metric.format(point.value)}</span>
                                                        {idx < item.data.length - 1 && (
                                                            <span className="text-slate-400 mx-1">→</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3 sm:space-y-4">
                                    {chartData
                                        .sort((a: any, b: any) => (b?.data[0]?.value || 0) - (a?.data[0]?.value || 0))
                                        .map((item: any, idx: number) => {
                                            const value = item.data[0]?.value || 0;
                                            const percentage = (value / maxValue) * 100;
                                            
                                            return (
                                                <div key={item.country}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Link 
                                                            href={`/countries/${item.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                            className="text-xs sm:text-sm text-slate-700 hover:text-blue-600 transition flex items-center gap-2"
                                                        >
                                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-xs font-medium">
                                                                {idx + 1}
                                                            </span>
                                                            {item.country}
                                                        </Link>
                                                        <span className="text-xs sm:text-sm font-medium text-slate-800">
                                                            {metric.format(value)}
                                                        </span>
                                                    </div>
                                                    <div className="h-5 sm:h-6 bg-slate-100 rounded-lg overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-lg transition-all duration-500 ease-out"
                                                            style={{ 
                                                                width: `${percentage}%`,
                                                                background: `linear-gradient(90deg, #3b82f6, #6366f1)`
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

                        {/* Comparison table */}
                        {!hasMultiYearData && chartData.length > 0 && (
                            <div className="mt-4 sm:mt-6 bg-white/80 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto table-scroll">
                                    <table className="w-full min-w-[400px]">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="text-left py-3 px-4 text-slate-500 font-medium text-xs sm:text-sm">Country</th>
                                                <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs sm:text-sm">{metric.label}</th>
                                                <th className="text-right py-3 px-4 text-slate-500 font-medium text-xs sm:text-sm">Share</th>
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
                                                        <tr key={item.country} className="border-b border-slate-100 hover:bg-slate-50">
                                                            <td className="py-3 px-4 text-slate-800 text-sm">{item.country}</td>
                                                            <td className="py-3 px-4 text-right text-blue-600 font-medium text-sm">{metric.format(value)}</td>
                                                            <td className="py-3 px-4 text-right text-slate-500 text-sm">{share}%</td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
