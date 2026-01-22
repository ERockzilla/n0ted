'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import SortableTable, { Column } from '@/components/SortableTable';

interface QueryResult {
    country: string;
    region: string;
    [key: string]: any;
}

interface TimeSeriesData {
    [country: string]: {
        [metric: string]: Array<{ year: number; value: number }>;
    };
}

const AVAILABLE_METRICS = [
    { key: 'population', label: 'Population', category: 'demographics', format: (v: number) => v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : `${(v / 1e6).toFixed(1)}M` },
    { key: 'life_expectancy', label: 'Life Expectancy', category: 'demographics', format: (v: number) => `${v.toFixed(1)} yrs` },
    { key: 'population_growth_pct', label: 'Pop. Growth %', category: 'demographics', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'gdp_ppp_billions', label: 'GDP (PPP) $B', category: 'economy', format: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}T` : `$${v.toFixed(0)}B` },
    { key: 'gdp_growth_pct', label: 'GDP Growth %', category: 'economy', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
    { key: 'gdp_per_capita', label: 'GDP Per Capita', category: 'economy', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'inflation_pct', label: 'Inflation %', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'unemployment_pct', label: 'Unemployment %', category: 'economy', format: (v: number) => `${v.toFixed(1)}%` },
    { key: 'exports_billions', label: 'Exports $B', category: 'economy', format: (v: number) => `$${v.toFixed(1)}B` },
    { key: 'imports_billions', label: 'Imports $B', category: 'economy', format: (v: number) => `$${v.toFixed(1)}B` },
    { key: 'external_debt_billions', label: 'External Debt $B', category: 'economy', format: (v: number) => `$${v.toFixed(1)}B` },
    { key: 'expenditure_pct_gdp', label: 'Military % GDP', category: 'military', format: (v: number) => `${v.toFixed(2)}%` },
];

const OPERATORS = [
    { value: 'gt', label: '>' },
    { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '<=' },
    { value: 'eq', label: '=' },
];

interface Filter {
    id: string;
    metric: string;
    operator: string;
    value: string;
}

export default function QueryPage() {
    const [timeseries, setTimeseries] = useState<TimeSeriesData>({});
    const [loading, setLoading] = useState(true);
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    // Query state
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['population', 'gdp_ppp_billions']);
    const [yearStart, setYearStart] = useState<number>(2015);
    const [yearEnd, setYearEnd] = useState<number>(2020);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [regionFilter, setRegionFilter] = useState<string>('all');

    // Results
    const [results, setResults] = useState<QueryResult[]>([]);
    const [hasQueried, setHasQueried] = useState(false);

    // Load timeseries data
    useEffect(() => {
        fetch('/api/countries/timeseries')
            .then(r => r.json())
            .then(data => {
                if (data.data) {
                    setTimeseries(data.data);

                    // Extract available years
                    const years = new Set<number>();
                    const firstCountry = Object.values(data.data)[0] as Record<string, Array<{ year: number }>>;
                    if (firstCountry) {
                        Object.values(firstCountry).forEach((metric: any) => {
                            if (Array.isArray(metric)) {
                                metric.forEach((point: { year: number }) => years.add(point.year));
                            }
                        });
                    }
                    const sortedYears = Array.from(years).sort((a, b) => a - b);
                    setAvailableYears(sortedYears);
                    if (sortedYears.length > 0) {
                        setYearStart(sortedYears[0]);
                        setYearEnd(sortedYears[sortedYears.length - 1]);
                    }
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Get unique regions from data
    const regions = useMemo(() => {
        const regionSet = new Set<string>();
        Object.keys(timeseries).forEach(country => {
            // Infer region from country name patterns (simplified)
            regionSet.add('All'); // We'll need to fetch this from country data
        });
        return ['all'];
    }, [timeseries]);

    const addFilter = () => {
        setFilters([...filters, {
            id: `filter-${Date.now()}`,
            metric: 'gdp_ppp_billions',
            operator: 'gt',
            value: '100'
        }]);
    };

    const removeFilter = (id: string) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id: string, field: keyof Filter, value: string) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [field]: value } : f));
    };

    const toggleMetric = (metric: string) => {
        if (selectedMetrics.includes(metric)) {
            setSelectedMetrics(selectedMetrics.filter(m => m !== metric));
        } else {
            setSelectedMetrics([...selectedMetrics, metric]);
        }
    };

    const runQuery = () => {
        const queryResults: QueryResult[] = [];

        Object.entries(timeseries).forEach(([countryKey, countryData]) => {
            const countryName = countryKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

            // Build result row
            const row: QueryResult = {
                country: countryName,
                region: 'N/A', // Would need to fetch from country data
            };

            let hasData = false;
            let passesFilters = true;

            // Get values for selected metrics within year range
            selectedMetrics.forEach(metric => {
                const metricData = countryData[metric];
                if (metricData && Array.isArray(metricData)) {
                    const filtered = metricData.filter(p => p.year >= yearStart && p.year <= yearEnd);
                    if (filtered.length > 0) {
                        // Use latest value in range
                        const latest = filtered.sort((a, b) => b.year - a.year)[0];
                        row[metric] = latest.value;
                        row[`${metric}_year`] = latest.year;
                        hasData = true;
                    }
                }
            });

            // Apply filters
            filters.forEach(filter => {
                const value = row[filter.metric];
                const compareValue = parseFloat(filter.value);

                if (value === undefined || isNaN(compareValue)) {
                    passesFilters = false;
                    return;
                }

                switch (filter.operator) {
                    case 'gt': passesFilters = passesFilters && value > compareValue; break;
                    case 'gte': passesFilters = passesFilters && value >= compareValue; break;
                    case 'lt': passesFilters = passesFilters && value < compareValue; break;
                    case 'lte': passesFilters = passesFilters && value <= compareValue; break;
                    case 'eq': passesFilters = passesFilters && Math.abs(value - compareValue) < 0.01; break;
                }
            });

            if (hasData && passesFilters) {
                queryResults.push(row);
            }
        });

        // Sort by first selected metric descending
        if (selectedMetrics.length > 0) {
            queryResults.sort((a, b) => (b[selectedMetrics[0]] || 0) - (a[selectedMetrics[0]] || 0));
        }

        setResults(queryResults);
        setHasQueried(true);
    };

    const exportCSV = () => {
        if (results.length === 0) return;

        const headers = ['Country', ...selectedMetrics.map(m => {
            const metric = AVAILABLE_METRICS.find(am => am.key === m);
            return metric?.label || m;
        })];

        const rows = results.map(r => [
            r.country,
            ...selectedMetrics.map(m => r[m] ?? 'N/A')
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportJSON = () => {
        if (results.length === 0) return;

        const data = results.map(r => {
            const obj: Record<string, any> = { country: r.country };
            selectedMetrics.forEach(m => {
                obj[m] = r[m] ?? null;
            });
            return obj;
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    // Build columns for results table
    const columns: Column<QueryResult>[] = useMemo(() => {
        const cols: Column<QueryResult>[] = [
            {
                key: 'country',
                label: 'Country',
                format: (val) => (
                    <Link
                        href={`/countries/${val.toLowerCase().replace(/\s+/g, '_')}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        {val}
                    </Link>
                ),
            },
        ];

        selectedMetrics.forEach(metric => {
            const metricInfo = AVAILABLE_METRICS.find(m => m.key === metric);
            cols.push({
                key: metric,
                label: metricInfo?.label || metric,
                align: 'right',
                format: (val) => val !== undefined ? (metricInfo?.format(val) || val) : 'N/A',
            });
        });

        return cols;
    }, [selectedMetrics]);

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">📊 Data Query Tool</h1>
                    <p className="text-slate-500">Build custom queries to explore and analyze the World Factbook data.</p>
                </div>

                {/* Query Builder */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                    {/* Metrics Selection */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Select Metrics</h3>
                        <div className="flex flex-wrap gap-2">
                            {AVAILABLE_METRICS.map(metric => (
                                <button
                                    key={metric.key}
                                    onClick={() => toggleMetric(metric.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${selectedMetrics.includes(metric.key)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {metric.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Year Range */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Year Range</h3>
                        <div className="flex items-center gap-4">
                            <select
                                value={yearStart}
                                onChange={(e) => setYearStart(parseInt(e.target.value))}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <span className="text-slate-400">to</span>
                            <select
                                value={yearEnd}
                                onChange={(e) => setYearEnd(parseInt(e.target.value))}
                                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                            >
                                {availableYears.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
                            <button
                                onClick={addFilter}
                                className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                            >
                                + Add Filter
                            </button>
                        </div>

                        {filters.length === 0 ? (
                            <p className="text-sm text-slate-400">No filters applied. Click "Add Filter" to narrow results.</p>
                        ) : (
                            <div className="space-y-2">
                                {filters.map(filter => (
                                    <div key={filter.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                                        <select
                                            value={filter.metric}
                                            onChange={(e) => updateFilter(filter.id, 'metric', e.target.value)}
                                            className="px-2 py-1.5 rounded border border-slate-200 text-sm bg-white"
                                        >
                                            {AVAILABLE_METRICS.map(m => (
                                                <option key={m.key} value={m.key}>{m.label}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={filter.operator}
                                            onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                                            className="px-2 py-1.5 rounded border border-slate-200 text-sm bg-white w-16"
                                        >
                                            {OPERATORS.map(op => (
                                                <option key={op.value} value={op.value}>{op.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={filter.value}
                                            onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                            className="px-2 py-1.5 rounded border border-slate-200 text-sm w-24"
                                            placeholder="Value"
                                        />
                                        <button
                                            onClick={() => removeFilter(filter.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={runQuery}
                            disabled={selectedMetrics.length === 0}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Run Query
                        </button>
                        {results.length > 0 && (
                            <>
                                <button
                                    onClick={exportCSV}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={exportJSON}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Export JSON
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Results */}
                {hasQueried && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-800">
                                Results <span className="text-slate-400 font-normal">({results.length} countries)</span>
                            </h2>
                        </div>

                        {results.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                No results match your query criteria.
                            </div>
                        ) : (
                            <SortableTable
                                data={results}
                                columns={columns}
                                rowKey="country"
                                initialSortColumn={selectedMetrics[0]}
                                initialSortDirection="desc"
                                className="border-0 shadow-none rounded-none"
                            />
                        )}
                    </div>
                )}

                {/* Summary Stats */}
                {results.length > 0 && selectedMetrics.length > 0 && (
                    <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
                        <h3 className="text-sm font-medium text-slate-300 mb-4">Summary Statistics</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {selectedMetrics.slice(0, 4).map(metric => {
                                const metricInfo = AVAILABLE_METRICS.find(m => m.key === metric);
                                const values = results.map(r => r[metric]).filter(v => v !== undefined) as number[];

                                if (values.length === 0) return null;

                                const sum = values.reduce((a, b) => a + b, 0);
                                const avg = sum / values.length;
                                const min = Math.min(...values);
                                const max = Math.max(...values);

                                return (
                                    <div key={metric} className="space-y-2">
                                        <p className="text-xs text-slate-400">{metricInfo?.label}</p>
                                        <div className="grid grid-cols-2 gap-1 text-xs">
                                            <div>
                                                <span className="text-slate-400">Min:</span>{' '}
                                                <span className="text-white">{metricInfo?.format(min)}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Max:</span>{' '}
                                                <span className="text-white">{metricInfo?.format(max)}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Avg:</span>{' '}
                                                <span className="text-white">{metricInfo?.format(avg)}</span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Total:</span>{' '}
                                                <span className="text-white">{metricInfo?.format(sum)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
