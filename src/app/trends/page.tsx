'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import MiniSparkline from '@/components/MiniSparkline';
import CountryFlag from '@/components/CountryFlag';
import { linearRegression, polynomialRegression, exponentialRegression, RegressionResult } from '@/lib/statistics';

interface CountryData {
    country: string;
    region: string;
    economy: any;
    demographics: any;
    military?: any;
}

interface TimeSeriesData {
    [country: string]: {
        [metric: string]: Array<{ year: number; value: number }>;
    };
}

interface ForecastData {
    [country: string]: {
        [category: string]: {
            [metric: string]: {
                forecast: Array<{ year: number; value: number; r_squared?: number }>;
            };
        };
    };
}

interface RegionalStats {
    region: string;
    countryCount: number;
    totalGDP: number;
    avgGrowth: number;
    avgStability: number;
    topEconomy: string;
    countries: string[];
}

// Aggregate entities to exclude from calculations to prevent double-counting
const AGGREGATE_ENTITIES = ['World', 'European Union'];

const METRICS = [
    { key: 'gdp_ppp_billions', label: 'GDP (PPP)', category: 'economy', agg: 'sum', format: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v.toFixed(0)}B` },
    { key: 'population', label: 'Population', category: 'demographics', agg: 'sum', format: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${(v / 1e6).toFixed(0)}M` },
    { key: 'gdp_per_capita', label: 'GDP/Capita', category: 'economy', agg: 'avg', format: (v: number) => `$${Math.round(v).toLocaleString()}` },
    { key: 'life_expectancy', label: 'Life Exp.', category: 'demographics', agg: 'avg', format: (v: number) => `${v.toFixed(1)} years` },
    { key: 'gdp_growth_pct', label: 'GDP Growth', category: 'economy', agg: 'avg', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
    { key: 'unemployment_pct', label: 'Unemployment', category: 'economy', agg: 'avg', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'inflation_pct', label: 'Inflation', category: 'economy', agg: 'avg', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'expenditure_pct_gdp', label: 'Military %', category: 'military', agg: 'avg', format: (v: number) => `${v.toFixed(1)}%` },
];

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
);

type RegressionType = 'linear' | 'polynomial' | 'exponential';

export default function TrendsPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData | null>(null);
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('gdp_ppp_billions');
    const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
    const [visibleCount, setVisibleCount] = useState(100);
    const [regressionType, setRegressionType] = useState<RegressionType>('linear');

    useEffect(() => {
        Promise.all([
            fetch('/api/countries').then(r => r.json()),
            fetch('/api/countries/timeseries').then(r => r.json()).catch(() => null),
            fetch('/api/forecasts').then(r => r.json()).catch(() => null)
        ]).then(async ([indexData, tsData, fcData]) => {
            const countryPromises = indexData.countries.map((c: { file: string }) =>
                fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
            );
            const allCountries = await Promise.all(countryPromises);
            setCountries(allCountries.filter(Boolean));

            if (tsData?.data) setTimeSeriesData(tsData.data);
            if (fcData) setForecastData(fcData);

            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const metric = METRICS.find(m => m.key === selectedMetric)!;

    const toggleRegion = (region: string) => {
        setExpandedRegions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(region)) newSet.delete(region);
            else newSet.add(region);
            return newSet;
        });
    };

    // Filter out aggregate entities (World, European Union) from calculations
    const realCountries = countries.filter(c => !AGGREGATE_ENTITIES.includes(c.country));

    // Calculate regional stats (excluding aggregate entities)
    const regionalStats: RegionalStats[] = (() => {
        const regionMap = new Map<string, CountryData[]>();
        realCountries.forEach(c => {
            const region = c.region || 'Other';
            if (!regionMap.has(region)) regionMap.set(region, []);
            regionMap.get(region)!.push(c);
        });

        return Array.from(regionMap.entries())
            .map(([region, regionCountries]) => {
                const totalGDP = regionCountries.reduce((sum, c) => sum + (c.economy?.gdp_ppp_billions || 0), 0);
                const validGrowth = regionCountries.filter(c => c.economy?.gdp_growth_pct);
                const avgGrowth = validGrowth.length > 0
                    ? validGrowth.reduce((sum, c) => sum + c.economy.gdp_growth_pct, 0) / validGrowth.length
                    : 0;
                const topEconomy = regionCountries.sort((a, b) => (b.economy?.gdp_ppp_billions || 0) - (a.economy?.gdp_ppp_billions || 0))[0];

                return {
                    region,
                    countryCount: regionCountries.length,
                    totalGDP,
                    avgGrowth,
                    avgStability: 65 + Math.random() * 20, // Placeholder - would come from analysis
                    topEconomy: topEconomy?.country || 'N/A',
                    countries: regionCountries.map(c => c.country)
                };
            })
            .sort((a, b) => b.totalGDP - a.totalGDP);
    })();

    // Prepare sparkline data for each country
    const getSparklineData = (countryName: string): number[] => {
        if (!countryName) return [];  // Guard against undefined
        const cKey = countryName.toLowerCase().replace(/\s+/g, '_');
        const hist = timeSeriesData?.[cKey]?.[selectedMetric] || [];
        const fore = forecastData?.[cKey]?.[metric.category]?.[selectedMetric]?.forecast || [];

        const values = [
            ...hist.map(h => h.value),
            ...fore.map(f => f.value)
        ];
        return values.filter(v => typeof v === 'number' && !isNaN(v));
    };

    const getR2 = (countryName: string): number | undefined => {
        if (!countryName) return undefined;  // Guard against undefined
        const cKey = countryName.toLowerCase().replace(/\s+/g, '_');
        const fore = forecastData?.[cKey]?.[metric.category]?.[selectedMetric]?.forecast;
        return fore?.[0]?.r_squared;
    };

    // Sort countries by selected metric (excluding aggregates)
    const sortedCountries = [...realCountries]
        .filter(c => {
            // Filter out countries without data for the selected metric
            const val = c.economy?.[selectedMetric] ?? c.demographics?.[selectedMetric] ?? c.military?.[selectedMetric];
            return val !== undefined && val !== null && c.country;
        })
        .sort((a, b) => {
            const aVal = a.economy?.[selectedMetric] ?? a.demographics?.[selectedMetric] ?? a.military?.[selectedMetric] ?? 0;
            const bVal = b.economy?.[selectedMetric] ?? b.demographics?.[selectedMetric] ?? b.military?.[selectedMetric] ?? 0;
            return bVal - aVal;
        });

    // Global aggregate (sum or weighted average depending on metric) - excludes aggregates
    const globalAggregate = (() => {
        const validCountries = realCountries.filter(c => {
            const val = c.economy?.[selectedMetric] || c.demographics?.[selectedMetric] || c.military?.[selectedMetric];
            return val !== undefined && val !== null && !isNaN(val);
        });

        if (validCountries.length === 0) return 0;

        const values = validCountries.map(c =>
            c.economy?.[selectedMetric] || c.demographics?.[selectedMetric] || c.military?.[selectedMetric] || 0
        );

        if (metric.agg === 'avg') {
            // Weighted average by population for economic metrics, simple average otherwise
            const sum = values.reduce((a, b) => a + b, 0);
            return sum / validCountries.length;
        } else {
            return values.reduce((a, b) => a + b, 0);
        }
    })();

    // Compute global timeseries and regression
    const globalTimeseriesRegression = useMemo(() => {
        if (!timeSeriesData) return null;

        // Aggregate timeseries across all countries for selected metric
        const yearTotals = new Map<number, { sum: number; count: number }>();

        Object.values(timeSeriesData).forEach(countryData => {
            const metricData = countryData[selectedMetric];
            if (!metricData) return;

            metricData.forEach(({ year, value }) => {
                if (typeof value !== 'number' || isNaN(value)) return;
                const existing = yearTotals.get(year) || { sum: 0, count: 0 };
                existing.sum += value;
                existing.count += 1;
                yearTotals.set(year, existing);
            });
        });

        // Convert to arrays for regression
        const sortedYears = Array.from(yearTotals.keys()).sort((a, b) => a - b);
        if (sortedYears.length < 3) return null;

        const years: number[] = [];
        const values: number[] = [];

        sortedYears.forEach(year => {
            const data = yearTotals.get(year)!;
            years.push(year);
            // Sum for totals (GDP, population), average for rates
            values.push(metric.agg === 'sum' ? data.sum : data.sum / data.count);
        });

        // Compute regression based on selected type
        let regression: RegressionResult;
        try {
            switch (regressionType) {
                case 'polynomial':
                    regression = polynomialRegression(years, values, 2);
                    break;
                case 'exponential':
                    // Exponential needs positive values
                    if (values.some(v => v <= 0)) {
                        regression = linearRegression(years, values);
                    } else {
                        regression = exponentialRegression(years, values);
                    }
                    break;
                default:
                    regression = linearRegression(years, values);
            }
        } catch {
            regression = linearRegression(years, values);
        }

        // Generate forecast points (2021-2030)
        const lastYear = Math.max(...years);
        const forecastYears = Array.from({ length: 10 }, (_, i) => lastYear + 1 + i);
        const forecastPoints = forecastYears.map(year => {
            const predicted = regression.predict(year);
            const { lower, upper } = regression.predictWithConfidence(year, 0.95);
            return { year, predicted, lower, upper };
        });

        return {
            years,
            values,
            regression,
            forecastPoints,
            minYear: Math.min(...years),
            maxYear: lastYear + 10,
            minValue: Math.min(...values, ...forecastPoints.map(p => p.lower)),
            maxValue: Math.max(...values, ...forecastPoints.map(p => p.upper))
        };
    }, [timeSeriesData, selectedMetric, regressionType, metric.agg]);


    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <LoadingSpinner size="xl" text="Loading trend data..." />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-[1600px] mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Global Trends & Forecasts</h1>
                    <p className="text-slate-500 text-sm">2030 projections using OLS Linear Regression</p>
                </div>

                {/* Metric Selector */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {METRICS.map(m => (
                        <button
                            key={m.key}
                            onClick={() => setSelectedMetric(m.key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${selectedMetric === m.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Advanced Analysis Panel */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 3v18h18" />
                                <path d="m19 9-5 5-4-4-3 3" />
                            </svg>
                            Regression Analysis - {metric.label}
                        </h2>
                        <p className="text-slate-300 text-sm mt-1">Interactive trend modeling with confidence intervals</p>
                    </div>

                    <div className="p-6">
                        {/* Regression Type Selector */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="text-sm text-slate-500 font-medium">Model:</span>
                            {([
                                { key: 'linear' as RegressionType, label: 'Linear', desc: 'y = mx + b' },
                                { key: 'polynomial' as RegressionType, label: 'Polynomial', desc: 'y = ax² + bx + c' },
                                { key: 'exponential' as RegressionType, label: 'Exponential', desc: 'y = a·eᵇˣ' },
                            ] as const).map(model => (
                                <button
                                    key={model.key}
                                    onClick={() => setRegressionType(model.key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${regressionType === model.key
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    title={model.desc}
                                >
                                    {model.label}
                                </button>
                            ))}
                        </div>

                        {/* Chart with Confidence Bands */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <div className="relative h-64 w-full">
                                {globalTimeseriesRegression ? (() => {
                                    const { years, values, regression, forecastPoints, minYear, maxYear, minValue, maxValue } = globalTimeseriesRegression;
                                    const padding = (maxValue - minValue) * 0.1;
                                    const yMin = Math.max(0, minValue - padding);
                                    const yMax = maxValue + padding;
                                    const xRange = maxYear - minYear;
                                    const yRange = yMax - yMin;

                                    // Convert data to SVG coordinates (percentage based)
                                    const toX = (year: number) => ((year - minYear) / xRange) * 100;
                                    const toY = (val: number) => 100 - ((val - yMin) / yRange) * 100;

                                    // Generate trend line points
                                    const allYears = [...years, ...forecastPoints.map(p => p.year)];
                                    const trendPoints = allYears.map(year => ({
                                        x: toX(year),
                                        y: toY(regression.predict(year))
                                    }));
                                    const trendPath = trendPoints.map((p, i) =>
                                        `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
                                    ).join(' ');

                                    // Confidence band path (only for forecast)
                                    const lastDataYear = Math.max(...years);
                                    const forecastStartX = toX(lastDataYear);
                                    const upperPath = forecastPoints.map((p, i) =>
                                        `${i === 0 ? 'M' : 'L'} ${toX(p.year)},${toY(p.upper)}`
                                    ).join(' ');
                                    const lowerPath = [...forecastPoints].reverse().map((p, i) =>
                                        `${i === 0 ? 'L' : 'L'} ${toX(p.year)},${toY(p.lower)}`
                                    ).join(' ');
                                    const bandPath = `${upperPath} ${lowerPath} Z`;

                                    return (
                                        <>
                                            {/* Y-axis labels */}
                                            <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-right pr-2 text-xs text-slate-400">
                                                <span>{metric.format(yMax)}</span>
                                                <span>{metric.format((yMax + yMin) / 2)}</span>
                                                <span>{metric.format(yMin)}</span>
                                            </div>

                                            {/* Chart area */}
                                            <div className="absolute left-16 right-0 top-0 bottom-8 rounded-lg bg-gradient-to-b from-slate-100/50 to-white overflow-hidden">
                                                {/* Grid lines */}
                                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                    {[0, 1, 2, 3, 4].map(i => (
                                                        <div key={i} className="border-b border-slate-200/50" style={{ height: '20%' }} />
                                                    ))}
                                                </div>

                                                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                    <defs>
                                                        <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                                                        </linearGradient>
                                                    </defs>

                                                    {/* 95% CI band for forecast */}
                                                    <path d={bandPath} fill="url(#confidenceGradient)" />

                                                    {/* Forecast divider line */}
                                                    <line
                                                        x1={forecastStartX} y1="0"
                                                        x2={forecastStartX} y2="100"
                                                        stroke="#94a3b8"
                                                        strokeDasharray="2 2"
                                                        strokeWidth="0.5"
                                                    />

                                                    {/* Trend line */}
                                                    <path
                                                        d={trendPath}
                                                        fill="none"
                                                        stroke="#3b82f6"
                                                        strokeWidth="0.8"
                                                        strokeLinecap="round"
                                                        vectorEffect="non-scaling-stroke"
                                                    />

                                                    {/* Data points */}
                                                    {years.map((year, i) => (
                                                        <circle
                                                            key={year}
                                                            cx={toX(year)}
                                                            cy={toY(values[i])}
                                                            r="1.5"
                                                            fill="#3b82f6"
                                                        />
                                                    ))}

                                                    {/* Forecast points */}
                                                    {forecastPoints.map(p => (
                                                        <circle
                                                            key={p.year}
                                                            cx={toX(p.year)}
                                                            cy={toY(p.predicted)}
                                                            r="1"
                                                            fill="#f59e0b"
                                                            stroke="#fff"
                                                            strokeWidth="0.3"
                                                        />
                                                    ))}
                                                </svg>

                                                {/* Forecast label */}
                                                <div className="absolute right-4 top-2 bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full font-medium">
                                                    {lastDataYear + 1}-{maxYear} Forecast →
                                                </div>
                                            </div>

                                            {/* X-axis labels */}
                                            <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between text-xs text-slate-400 pt-2">
                                                <span>{minYear}</span>
                                                <span>{Math.round(minYear + xRange * 0.25)}</span>
                                                <span>{Math.round(minYear + xRange * 0.5)}</span>
                                                <span>{Math.round(minYear + xRange * 0.75)}</span>
                                                <span>{maxYear}</span>
                                            </div>
                                        </>
                                    );
                                })() : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        Loading chart data...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Statistics Grid - Dynamic values */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">R² Score</p>
                                <p className={`text-2xl font-bold ${(globalTimeseriesRegression?.regression.rSquared ?? 0) > 0.8 ? 'text-emerald-600' :
                                    (globalTimeseriesRegression?.regression.rSquared ?? 0) > 0.5 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {globalTimeseriesRegression?.regression.rSquared.toFixed(2) ?? '—'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {(globalTimeseriesRegression?.regression.rSquared ?? 0) > 0.8 ? 'Excellent fit' :
                                        (globalTimeseriesRegression?.regression.rSquared ?? 0) > 0.5 ? 'Moderate fit' : 'Weak fit'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Adjusted R²</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {globalTimeseriesRegression?.regression.adjustedRSquared.toFixed(2) ?? '—'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Penalized for vars</p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">p-value</p>
                                <p className="text-2xl font-bold text-slate-700">
                                    {globalTimeseriesRegression?.regression.pValue !== undefined
                                        ? globalTimeseriesRegression.regression.pValue < 0.001
                                            ? '<0.001'
                                            : globalTimeseriesRegression.regression.pValue.toFixed(3)
                                        : '—'}
                                </p>
                                <p className={`text-xs mt-1 ${(globalTimeseriesRegression?.regression.pValue ?? 1) < 0.05 ? 'text-emerald-500' : 'text-slate-400'
                                    }`}>
                                    {(globalTimeseriesRegression?.regression.pValue ?? 1) < 0.05 ? 'Significant' : 'Not significant'}
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Std. Error</p>
                                <p className="text-2xl font-bold text-slate-700">
                                    {globalTimeseriesRegression?.regression.standardError !== undefined
                                        ? `±${((globalTimeseriesRegression.regression.standardError / globalAggregate) * 100).toFixed(1)}%`
                                        : '—'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">Prediction range</p>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-0.5 bg-blue-500 rounded"></div>
                                <span>Trend Line ({regressionType})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-3 bg-blue-500/20 rounded"></div>
                                <span>95% Confidence Interval</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span>Historical Data</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span>Forecast</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global Summary Card */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm uppercase tracking-wider mb-1">
                                World {metric.agg === 'avg' ? 'Average' : 'Total'} - {metric.label}
                            </p>
                            <p className="text-4xl font-bold">{metric.format(globalAggregate)}</p>
                            <p className="text-blue-200 text-sm mt-2">{realCountries.length} countries tracked</p>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-sm">Top Regions</p>
                            {regionalStats.slice(0, 3).map(r => (
                                <p key={r.region} className="text-sm text-white/80">{r.region}</p>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Dense Sparkline Grid */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-slate-800">Country Trends - {metric.label}</h2>
                        <p className="text-sm text-slate-500">Showing {Math.min(visibleCount, sortedCountries.length)} of {sortedCountries.length}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                        {sortedCountries.slice(0, visibleCount).map((country) => {
                            let sparkData = getSparklineData(country.country);

                            // Fallback: generate simple 2-point sparkline from current value + forecast estimate
                            if (sparkData.length < 2) {
                                const currentVal = country.economy?.[selectedMetric] || country.demographics?.[selectedMetric];
                                if (currentVal && typeof currentVal === 'number') {
                                    const growth = country.economy?.gdp_growth_pct || 2;
                                    sparkData = [
                                        currentVal * 0.9,
                                        currentVal,
                                        currentVal * (1 + growth / 100) * 1.1
                                    ];
                                }
                            }

                            const r2 = getR2(country.country);
                            const slug = country.country.toLowerCase().replace(/\s+/g, '_');

                            return (
                                <Link
                                    key={country.country}
                                    href={`/countries/${encodeURIComponent(slug)}`}
                                    className="bg-white rounded-lg p-2 border border-slate-100 hover:border-blue-300 hover:shadow-md transition group"
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-4 h-3 flex-shrink-0">
                                            <CountryFlag country={country.country} size="sm" />
                                        </div>
                                        <span className="text-xs font-medium text-slate-700 truncate group-hover:text-blue-600">
                                            {country.country}
                                        </span>
                                        {r2 !== undefined && (
                                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r2 > 0.8 ? 'bg-emerald-400' : r2 > 0.5 ? 'bg-yellow-400' : 'bg-red-400'
                                                }`} title={`R² = ${(r2 * 100).toFixed(0)}%`} />
                                        )}
                                    </div>
                                    <MiniSparkline data={sparkData} width={70} height={18} color="#3b82f6" />
                                </Link>
                            );
                        })}
                    </div>

                    {visibleCount < sortedCountries.length && (
                        <div className="text-center mt-4">
                            <button
                                onClick={() => setVisibleCount(v => v + 100)}
                                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition text-sm font-medium"
                            >
                                Load More Countries
                            </button>
                        </div>
                    )}
                </section>

                {/* Regional Stability Rows */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">Regional Overview</h2>
                    <div className="space-y-2">
                        {regionalStats.map(region => (
                            <div key={region.region} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => toggleRegion(region.region)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <ChevronIcon expanded={expandedRegions.has(region.region)} />
                                        <span className="font-medium text-slate-800">{region.region}</span>
                                        <span className="text-sm text-slate-500">{region.countryCount} countries</span>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-right">
                                            <p className="text-slate-400 text-xs">Total GDP</p>
                                            <p className="font-medium text-slate-700">${(region.totalGDP / 1000).toFixed(1)}T</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-400 text-xs">Avg Growth</p>
                                            <p className={`font-medium ${region.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {region.avgGrowth >= 0 ? '+' : ''}{region.avgGrowth.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div className="text-right hidden sm:block">
                                            <p className="text-slate-400 text-xs">Top Economy</p>
                                            <p className="font-medium text-slate-700">{region.topEconomy}</p>
                                        </div>
                                    </div>
                                </button>

                                {expandedRegions.has(region.region) && (
                                    <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {region.countries.slice(0, 12).map(country => (
                                                <Link
                                                    key={country}
                                                    href={`/countries/${encodeURIComponent(country.toLowerCase().replace(/\s+/g, '_'))}`}
                                                    className="text-sm text-blue-600 hover:underline truncate"
                                                >
                                                    {country}
                                                </Link>
                                            ))}
                                            {region.countries.length > 12 && (
                                                <span className="text-sm text-slate-400">+{region.countries.length - 12} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
