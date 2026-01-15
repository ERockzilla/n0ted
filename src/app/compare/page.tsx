'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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

interface IndexEntry {
    name: string;
    region: string;
    file: string;
}

export default function ComparePage() {
    const [countries, setCountries] = useState<IndexEntry[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [data, setData] = useState<CountryData[]>([]);
    const [loading, setLoading] = useState(true);

    // Load country list
    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(d => {
                setCountries(d.countries || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Load selected countries data
    useEffect(() => {
        if (selected.length === 0) {
            setData([]);
            return;
        }

        Promise.all(
            selected.map(file =>
                fetch(`/api/countries/${file.replace('.json', '')}`).then(r => r.json())
            )
        ).then(results => {
            setData(results.filter(Boolean));
        });
    }, [selected]);

    const toggleCountry = (file: string) => {
        setSelected(prev => {
            if (prev.includes(file)) {
                return prev.filter(f => f !== file);
            }
            if (prev.length >= 4) {
                return prev; // Max 4 countries
            }
            return [...prev, file];
        });
    };

    const formatValue = (val: number | undefined, type: 'number' | 'percent' | 'billions' = 'number') => {
        if (val === undefined || val === null) return 'N/A';
        if (type === 'percent') return `${val.toFixed(1)}%`;
        if (type === 'billions') return val >= 1000 ? `$${(val / 1000).toFixed(1)}T` : `$${val.toFixed(1)}B`;
        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
        return val.toLocaleString();
    };

    const metrics = [
        { key: 'demographics.population', label: 'Population', type: 'number' as const },
        { key: 'demographics.life_expectancy', label: 'Life Expectancy', type: 'number' as const },
        { key: 'economy.gdp_ppp_billions', label: 'GDP (PPP)', type: 'billions' as const },
        { key: 'economy.gdp_growth_pct', label: 'GDP Growth', type: 'percent' as const },
        { key: 'economy.gdp_per_capita', label: 'GDP per Capita', type: 'number' as const },
        { key: 'economy.unemployment_pct', label: 'Unemployment', type: 'percent' as const },
        { key: 'economy.inflation_pct', label: 'Inflation', type: 'percent' as const },
        { key: 'economy.exports_billions', label: 'Exports', type: 'billions' as const },
        { key: 'economy.imports_billions', label: 'Imports', type: 'billions' as const },
        { key: 'military.expenditure_pct_gdp', label: 'Military % GDP', type: 'percent' as const },
    ];

    const getNestedValue = (obj: CountryData, path: string): number | undefined => {
        const parts = path.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = obj;
        for (const part of parts) {
            if (current === undefined || current === null) return undefined;
            current = current[part];
        }
        return typeof current === 'number' ? current : undefined;
    };

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold text-white mb-2">Compare Countries</h1>
                <p className="text-slate-400 mb-8">Select up to 4 countries for side-by-side comparison</p>

                {/* Country Selector */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        {loading ? (
                            <p className="text-slate-400">Loading countries...</p>
                        ) : (
                            countries.map(c => (
                                <button
                                    key={c.file}
                                    onClick={() => toggleCountry(c.file)}
                                    className={`px-3 py-1 rounded-full text-sm transition ${selected.includes(c.file)
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                        Selected: {selected.length}/4
                    </p>
                </div>

                {/* Comparison Table */}
                {data.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Metric</th>
                                    {data.map(c => (
                                        <th key={c.country} className="text-left py-3 px-4 text-white font-semibold">
                                            {c.country}
                                            <span className="block text-xs font-normal text-slate-400">{c.region}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {metrics.map(metric => {
                                    const values = data.map(c => getNestedValue(c, metric.key));
                                    const max = Math.max(...values.filter((v): v is number => v !== undefined));

                                    return (
                                        <tr key={metric.key} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                                            <td className="py-3 px-4 text-slate-300">{metric.label}</td>
                                            {data.map((c, i) => {
                                                const val = values[i];
                                                const isMax = val === max && val !== undefined;
                                                return (
                                                    <td key={c.country} className="py-3 px-4">
                                                        <span className={`font-medium ${isMax ? 'text-cyan-400' : 'text-white'}`}>
                                                            {formatValue(val, metric.type)}
                                                        </span>
                                                        {isMax && val !== undefined && <span className="ml-2 text-xs text-cyan-400">↑</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                                {/* Leaders row */}
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-3 px-4 text-slate-300">Leader</td>
                                    {data.map(c => (
                                        <td key={c.country} className="py-3 px-4 text-white">
                                            {c.political.chief_of_state || 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {data.length === 0 && !loading && (
                    <div className="text-center py-16 text-slate-400">
                        <p className="text-xl mb-2">Select countries above to compare</p>
                        <p>Click on country names to add them to the comparison</p>
                    </div>
                )}
            </main>
        </div>
    );
}
