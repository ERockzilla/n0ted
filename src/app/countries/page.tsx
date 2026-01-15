'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import CountryFlag from '@/components/CountryFlag';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: {
        population?: number;
        population_growth_pct?: number;
        life_expectancy?: number;
        median_age?: number;
        birth_rate?: number;
        death_rate?: number;
    };
    economy: {
        gdp_ppp_billions?: number;
        gdp_growth_pct?: number;
        gdp_per_capita?: number;
        inflation_pct?: number;
        unemployment_pct?: number;
        exports_billions?: number;
        imports_billions?: number;
    };
    military: {
        expenditure_pct_gdp?: number;
    };
    political: {
        chief_of_state?: string;
        head_of_government?: string;
        last_election?: string;
    };
}

// SVG Icons as components
const ChevronDownIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const ChevronRightIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 18 6-6-6-6"/>
    </svg>
);

const ExternalLinkIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6"/>
        <path d="M10 14 21 3"/>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    </svg>
);

const UsersIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animated">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const CoinsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animated">
        <circle cx="8" cy="8" r="6"/>
        <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
        <path d="M7 6h1v4"/>
        <path d="m16.71 13.88.7.71-2.82 2.82"/>
    </svg>
);

const TrendingUpIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animated">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
    </svg>
);

const LandmarkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-animated">
        <line x1="3" x2="21" y1="22" y2="22"/>
        <line x1="6" x2="6" y1="18" y2="11"/>
        <line x1="10" x2="10" y1="18" y2="11"/>
        <line x1="14" x2="14" y1="18" y2="11"/>
        <line x1="18" x2="18" y1="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
    </svg>
);

export default function CountriesPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'gdp' | 'population' | 'growth'>('name');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                const countryPromises = data.countries.map((c: { file: string }) =>
                    fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
                );
                const allCountries = await Promise.all(countryPromises);
                setCountries(allCountries.filter(Boolean));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const toggleRow = (country: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(country)) {
                newSet.delete(country);
            } else {
                newSet.add(country);
            }
            return newSet;
        });
    };

    // Get unique regions
    const regions = [...new Set(countries.map(c => c.region))].sort();

    // Filter and sort countries
    let filteredCountries = selectedRegion
        ? countries.filter(c => c.region === selectedRegion)
        : countries;

    if (searchQuery) {
        filteredCountries = filteredCountries.filter(c =>
            c.country.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const sortedCountries = [...filteredCountries].sort((a, b) => {
        switch (sortBy) {
            case 'gdp':
                return (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0);
            case 'population':
                return (b.demographics.population || 0) - (a.demographics.population || 0);
            case 'growth':
                return (b.economy.gdp_growth_pct || 0) - (a.economy.gdp_growth_pct || 0);
            default:
                return a.country.localeCompare(b.country);
        }
    });

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500">Loading countries...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">
                            {selectedRegion || 'All Countries'}
                        </h1>
                        <p className="text-slate-500">{sortedCountries.length} countries</p>
                    </div>

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-full md:w-64"
                    />
                </div>

                {/* Sort Controls */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="text-slate-500">Sort by:</span>
                    {(['name', 'gdp', 'population', 'growth'] as const).map(key => (
                        <button
                            key={key}
                            onClick={() => setSortBy(key)}
                            className={`px-3 py-1.5 rounded-lg capitalize transition ${
                                sortBy === key
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
                            }`}
                        >
                            {key}
                        </button>
                    ))}
                </div>

                {/* Region Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedRegion(null)}
                        className={`px-4 py-2 rounded-full text-sm transition ${
                            !selectedRegion
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                    >
                        All
                    </button>
                    {regions.map(region => (
                        <button
                            key={region}
                            onClick={() => setSelectedRegion(region)}
                            className={`px-4 py-2 rounded-full text-sm transition ${
                                selectedRegion === region
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                        >
                            {region}
                        </button>
                    ))}
                </div>

                {/* Countries Table */}
                <div className="bg-white/90 rounded-xl border border-slate-200 overflow-hidden backdrop-blur-sm shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="w-10 py-4 px-4"></th>
                                    <th className="text-left py-4 px-4 text-slate-500 font-medium text-sm">Country</th>
                                    <th className="text-left py-4 px-4 text-slate-500 font-medium text-sm">Region</th>
                                    <th className="text-right py-4 px-4 text-slate-500 font-medium text-sm">Population</th>
                                    <th className="text-right py-4 px-4 text-slate-500 font-medium text-sm">GDP (PPP)</th>
                                    <th className="text-right py-4 px-4 text-slate-500 font-medium text-sm">Growth</th>
                                    <th className="text-right py-4 px-4 text-slate-500 font-medium text-sm">GDP/Capita</th>
                                    <th className="w-10 py-4 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCountries.map((country) => {
                                    const isExpanded = expandedRows.has(country.country);
                                    const slug = country.country.toLowerCase().replace(/\s+/g, '_');

                                    return (
                                        <React.Fragment key={country.country}>
                                            <tr 
                                                className={`border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${
                                                    isExpanded ? 'bg-blue-50/50' : ''
                                                }`}
                                                onClick={() => toggleRow(country.country)}
                                            >
                                                <td className="py-3 px-4">
                                                    <button className="text-slate-400 hover:text-slate-600 transition">
                                                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <CountryFlag country={country.country} size="md" />
                                                        <span className="font-medium text-slate-800">{country.country}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-sm">{country.region}</td>
                                                <td className="py-3 px-4 text-right text-slate-700">
                                                    {formatNumber(country.demographics.population)}
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-700">
                                                    {formatBillions(country.economy.gdp_ppp_billions)}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {country.economy.gdp_growth_pct !== undefined ? (
                                                        <span className={country.economy.gdp_growth_pct > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                            {country.economy.gdp_growth_pct > 0 ? '+' : ''}{country.economy.gdp_growth_pct.toFixed(1)}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right text-slate-700">
                                                    {country.economy.gdp_per_capita 
                                                        ? `$${country.economy.gdp_per_capita.toLocaleString()}`
                                                        : 'N/A'
                                                    }
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Link
                                                        href={`/countries/${slug}`}
                                                        className="text-blue-500 hover:text-blue-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLinkIcon size={16} />
                                                    </Link>
                                                </td>
                                            </tr>
                                            
                                            {/* Expanded Details Row */}
                                            {isExpanded && (
                                                <tr key={`${country.country}-details`} className="bg-slate-50">
                                                    <td colSpan={8} className="py-4 px-8">
                                                        <div className="grid md:grid-cols-4 gap-6">
                                                            {/* Demographics */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                                    <UsersIcon />
                                                                    Demographics
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <DetailRow label="Life Expectancy" value={country.demographics.life_expectancy ? `${country.demographics.life_expectancy.toFixed(1)} yrs` : 'N/A'} />
                                                                    <DetailRow label="Median Age" value={country.demographics.median_age ? `${country.demographics.median_age.toFixed(1)} yrs` : 'N/A'} />
                                                                    <DetailRow label="Pop. Growth" value={formatPercent(country.demographics.population_growth_pct)} />
                                                                    <DetailRow label="Birth Rate" value={country.demographics.birth_rate ? `${country.demographics.birth_rate.toFixed(1)}/1000` : 'N/A'} />
                                                                </div>
                                                            </div>

                                                            {/* Economy */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                                    <CoinsIcon />
                                                                    Economy
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <DetailRow label="Inflation" value={formatPercent(country.economy.inflation_pct)} />
                                                                    <DetailRow label="Unemployment" value={formatPercent(country.economy.unemployment_pct)} />
                                                                    <DetailRow label="Exports" value={formatBillions(country.economy.exports_billions)} />
                                                                    <DetailRow label="Imports" value={formatBillions(country.economy.imports_billions)} />
                                                                </div>
                                                            </div>

                                                            {/* Trade & Military */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                                    <TrendingUpIcon />
                                                                    Trade & Military
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <DetailRow 
                                                                        label="Trade Balance" 
                                                                        value={country.economy.exports_billions && country.economy.imports_billions
                                                                            ? formatBillions(country.economy.exports_billions - country.economy.imports_billions)
                                                                            : 'N/A'
                                                                        }
                                                                        highlight={country.economy.exports_billions && country.economy.imports_billions
                                                                            ? country.economy.exports_billions - country.economy.imports_billions
                                                                            : undefined
                                                                        }
                                                                    />
                                                                    <DetailRow label="Military % GDP" value={formatPercent(country.military.expenditure_pct_gdp)} />
                                                                </div>
                                                            </div>

                                                            {/* Political */}
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-medium text-slate-600 flex items-center gap-2">
                                                                    <LandmarkIcon />
                                                                    Leadership
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    {country.political.chief_of_state && (
                                                                        <div>
                                                                            <p className="text-slate-500">Chief of State</p>
                                                                            <p className="text-slate-800 text-xs truncate">{country.political.chief_of_state}</p>
                                                                        </div>
                                                                    )}
                                                                    {country.political.head_of_government && (
                                                                        <div>
                                                                            <p className="text-slate-500">Head of Govt</p>
                                                                            <p className="text-slate-800 text-xs truncate">{country.political.head_of_government}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 pt-4 border-t border-slate-200">
                                                            <Link
                                                                href={`/countries/${slug}`}
                                                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                                                            >
                                                                View full country profile
                                                                <ExternalLinkIcon size={14} />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: number }) {
    let colorClass = 'text-slate-800';
    if (highlight !== undefined) {
        colorClass = highlight > 0 ? 'text-emerald-600' : highlight < 0 ? 'text-red-600' : 'text-slate-800';
    }

    return (
        <div className="flex justify-between">
            <span className="text-slate-500">{label}</span>
            <span className={colorClass}>{value}</span>
        </div>
    );
}

function formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

function formatBillions(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
    return `$${n.toFixed(0)}B`;
}

function formatPercent(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    return `${n.toFixed(1)}%`;
}
