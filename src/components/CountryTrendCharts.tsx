'use client';

import React, { useState } from 'react';
import TrendChart from './TrendChart';

interface TimeSeriesData {
    [metric: string]: Array<{ year: number; value: number }>;
}

interface ForecastData {
    [category: string]: {
        [metric: string]: {
            forecast: Array<{ year: number; value: number; ci_low?: number; ci_high?: number; r_squared?: number; slope?: number }>;
        };
    };
}

interface CountryTrendChartsProps {
    countrySlug: string;
    countryName: string;
}

const METRIC_CONFIG = [
    {
        key: 'gdp_ppp_billions',
        label: 'GDP (PPP)',
        category: 'economy',
        unit: '$B',
        color: '#f59e0b'
    },
    {
        key: 'population',
        label: 'Population',
        category: 'demographics',
        unit: '',
        color: '#10b981'
    },
    {
        key: 'life_expectancy',
        label: 'Life Expectancy',
        category: 'demographics',
        unit: 'years',
        color: '#3b82f6'
    },
    {
        key: 'gdp_per_capita',
        label: 'GDP Per Capita',
        category: 'economy',
        unit: '$',
        color: '#8b5cf6'
    },
    {
        key: 'gdp_growth_pct',
        label: 'GDP Growth Rate',
        category: 'economy',
        unit: '%',
        color: '#06b6d4'
    },
    {
        key: 'unemployment_pct',
        label: 'Unemployment',
        category: 'economy',
        unit: '%',
        color: '#ef4444'
    },
];

export default function CountryTrendCharts({ countrySlug, countryName }: CountryTrendChartsProps) {
    const [timeseriesData, setTimeseriesData] = React.useState<TimeSeriesData | null>(null);
    const [forecastData, setForecastData] = React.useState<ForecastData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [selectedMetric, setSelectedMetric] = useState<string>('gdp_ppp_billions');

    React.useEffect(() => {
        Promise.all([
            fetch('/api/countries/timeseries').then(r => r.json()).catch(() => null),
            fetch('/api/forecasts').then(r => r.json()).catch(() => null)
        ]).then(([tsResponse, fcData]) => {
            const countryKey = countrySlug.toLowerCase().replace(/[\s,]+/g, '_');
            if (tsResponse?.data?.[countryKey]) {
                setTimeseriesData(tsResponse.data[countryKey]);
            }
            if (fcData?.[countryKey]) {
                setForecastData(fcData[countryKey]);
            }
            setLoading(false);
        });
    }, [countrySlug]);

    if (loading) {
        return (
            <div className="p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500">Loading trend data...</span>
                </div>
            </div>
        );
    }

    if (!timeseriesData) {
        return (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-slate-500">
                No historical trend data available for {countryName}.
            </div>
        );
    }

    const currentConfig = METRIC_CONFIG.find(m => m.key === selectedMetric) || METRIC_CONFIG[0];
    const historical = timeseriesData[selectedMetric] || [];
    const forecast = forecastData?.[currentConfig.category]?.[selectedMetric]?.forecast || [];

    // Filter to only show metrics that have data
    const availableMetrics = METRIC_CONFIG.filter(m => {
        const data = timeseriesData[m.key];
        return data && data.length > 1;
    });

    return (
        <div className="p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-sm sm:text-lg font-semibold text-slate-700 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                        <polyline points="16 7 22 7 22 13" />
                    </svg>
                    Historical Trends
                </h2>

                {/* Metric Selector */}
                <div className="flex gap-1 flex-wrap">
                    {availableMetrics.map(metric => (
                        <button
                            key={metric.key}
                            onClick={() => setSelectedMetric(metric.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${selectedMetric === metric.key
                                    ? 'text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            style={selectedMetric === metric.key ? { backgroundColor: metric.color } : {}}
                        >
                            {metric.label}
                        </button>
                    ))}
                </div>
            </div>

            {historical.length > 1 ? (
                <TrendChart
                    title={currentConfig.label}
                    historical={historical}
                    forecast={forecast}
                    unit={currentConfig.unit}
                    color={currentConfig.color}
                />
            ) : (
                <div className="py-8 text-center text-slate-400">
                    Not enough data points to display trend for {currentConfig.label}.
                </div>
            )}

            {/* Data Summary */}
            {historical.length > 1 && (
                <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-400">First Year</p>
                        <p className="font-medium text-slate-700">{historical[0]?.year}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Latest Year</p>
                        <p className="font-medium text-slate-700">{historical[historical.length - 1]?.year}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Data Points</p>
                        <p className="font-medium text-slate-700">{historical.length}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400">Change</p>
                        {historical.length >= 2 && (
                            <p className={`font-medium ${((historical[historical.length - 1]?.value - historical[0]?.value) / historical[0]?.value) >= 0
                                    ? 'text-emerald-600'
                                    : 'text-red-600'
                                }`}>
                                {((historical[historical.length - 1]?.value - historical[0]?.value) / historical[0]?.value * 100).toFixed(1)}%
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
