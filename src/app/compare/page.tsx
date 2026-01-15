'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import CountryFlag from '@/components/CountryFlag';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [showSelector, setShowSelector] = useState(true);

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
                return prev;
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
        { key: 'demographics.life_expectancy', label: 'Life Exp.', type: 'number' as const },
        { key: 'economy.gdp_ppp_billions', label: 'GDP (PPP)', type: 'billions' as const },
        { key: 'economy.gdp_growth_pct', label: 'Growth', type: 'percent' as const },
        { key: 'economy.gdp_per_capita', label: 'Per Capita', type: 'number' as const },
        { key: 'economy.unemployment_pct', label: 'Unemploy.', type: 'percent' as const },
        { key: 'economy.inflation_pct', label: 'Inflation', type: 'percent' as const },
        { key: 'economy.exports_billions', label: 'Exports', type: 'billions' as const },
        { key: 'economy.imports_billions', label: 'Imports', type: 'billions' as const },
        { key: 'military.expenditure_pct_gdp', label: 'Military %', type: 'percent' as const },
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

    const filteredCountries = searchQuery
        ? countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : countries;

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Compare Countries</h1>
                    <p className="text-slate-500 text-sm sm:text-base">Select up to 4 countries for side-by-side comparison</p>
                </div>

                {/* Selected Countries Pills */}
                {selected.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {data.map(c => (
                            <div
                                key={c.country}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
                            >
                                <CountryFlag country={c.country} size="sm" />
                                <span className="text-sm text-blue-700">{c.country}</span>
                                <button
                                    onClick={() => toggleCountry(countries.find(x => x.name === c.country)?.file || '')}
                                    className="text-blue-400 hover:text-blue-600"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Country Selector Toggle (Mobile) */}
                <button
                    onClick={() => setShowSelector(!showSelector)}
                    className="w-full sm:hidden mb-4 px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm flex items-center justify-between"
                >
                    <span>Select Countries ({selected.length}/4)</span>
                    <svg 
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={`transition-transform ${showSelector ? 'rotate-180' : ''}`}
                    >
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </button>

                {/* Country Selector */}
                <div className={`mb-6 sm:mb-8 ${showSelector ? '' : 'hidden sm:block'}`}>
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full mb-3 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-base"
                    />
                    
                    <div className="flex flex-wrap gap-2 max-h-40 sm:max-h-48 overflow-y-auto p-3 sm:p-4 rounded-xl bg-white/80 border border-slate-200">
                        {loading ? (
                            <p className="text-slate-500 text-sm">Loading countries...</p>
                        ) : filteredCountries.length === 0 ? (
                            <p className="text-slate-500 text-sm">No countries found</p>
                        ) : (
                            filteredCountries.map(c => (
                                <button
                                    key={c.file}
                                    onClick={() => toggleCountry(c.file)}
                                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${selected.includes(c.file)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {c.name}
                                </button>
                            ))
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                        Selected: {selected.length}/4
                    </p>
                </div>

                {/* Comparison View */}
                {data.length > 0 && (
                    <>
                        {/* Mobile: Card View */}
                        <div className="sm:hidden space-y-4">
                            {metrics.map(metric => {
                                const values = data.map(c => getNestedValue(c, metric.key));
                                const max = Math.max(...values.filter((v): v is number => v !== undefined));

                                return (
                                    <div key={metric.key} className="p-4 rounded-xl bg-white/80 border border-slate-200">
                                        <h3 className="text-sm font-medium text-slate-500 mb-3">{metric.label}</h3>
                                        <div className="space-y-2">
                                            {data.map((c, i) => {
                                                const val = values[i];
                                                const isMax = val === max && val !== undefined;
                                                return (
                                                    <div key={c.country} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CountryFlag country={c.country} size="sm" />
                                                            <span className="text-sm text-slate-700">{c.country}</span>
                                                        </div>
                                                        <span className={`text-sm font-medium ${isMax ? 'text-blue-600' : 'text-slate-800'}`}>
                                                            {formatValue(val, metric.type)}
                                                            {isMax && val !== undefined && <span className="ml-1 text-blue-500">★</span>}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                            <div className="bg-white/80 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="text-left py-3 px-4 text-slate-500 font-medium text-sm">Metric</th>
                                            {data.map(c => (
                                                <th key={c.country} className="text-left py-3 px-4 text-slate-800 font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <CountryFlag country={c.country} size="md" />
                                                        <div>
                                                            <Link 
                                                                href={`/countries/${c.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                                className="hover:text-blue-600 transition"
                                                            >
                                                                {c.country}
                                                            </Link>
                                                            <span className="block text-xs font-normal text-slate-500">{c.region}</span>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.map(metric => {
                                            const values = data.map(c => getNestedValue(c, metric.key));
                                            const max = Math.max(...values.filter((v): v is number => v !== undefined));

                                            return (
                                                <tr key={metric.key} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="py-3 px-4 text-slate-600 text-sm">{metric.label}</td>
                                                    {data.map((c, i) => {
                                                        const val = values[i];
                                                        const isMax = val === max && val !== undefined;
                                                        return (
                                                            <td key={c.country} className="py-3 px-4">
                                                                <span className={`font-medium text-sm ${isMax ? 'text-blue-600' : 'text-slate-800'}`}>
                                                                    {formatValue(val, metric.type)}
                                                                </span>
                                                                {isMax && val !== undefined && <span className="ml-2 text-xs text-blue-500">★</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}

                                        {/* Leaders row */}
                                        <tr className="border-b border-slate-100">
                                            <td className="py-3 px-4 text-slate-600 text-sm">Leader</td>
                                            {data.map(c => (
                                                <td key={c.country} className="py-3 px-4 text-slate-800 text-sm">
                                                    {c.political.chief_of_state || 'N/A'}
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {data.length === 0 && !loading && (
                    <div className="text-center py-12 sm:py-16 bg-white/80 rounded-xl border border-slate-200">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mx-auto">
                            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
                            <path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
                        </svg>
                        <p className="text-lg sm:text-xl text-slate-800 mt-4 mb-2">Select countries to compare</p>
                        <p className="text-slate-500 text-sm">Click on country names above to add them</p>
                    </div>
                )}
            </main>
        </div>
    );
}
