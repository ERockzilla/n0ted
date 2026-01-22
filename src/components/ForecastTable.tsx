'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ForecastData {
    country: string;
    historical: { year: number; value: number }[];
    forecast: { year: number; value: number; ci_low: number; ci_high: number; r_squared: number; volatility: number }[];
}

interface Props {
    data: ForecastData[];
    metricLabel: string;
    formatValue: (v: number) => string;
}

type SortField = 'country' | 'value2020' | 'value2030' | 'growth' | 'r_squared' | 'volatility';

export default function ForecastTable({ data, metricLabel, formatValue }: Props) {
    const [sortField, setSortField] = useState<SortField>('value2030');
    const [sortAsc, setSortAsc] = useState(false);
    const [page, setPage] = useState(1);
    const rowsPerPage = 20;

    const getSortValue = (item: ForecastData, field: SortField) => {
        const hist2020 = item.historical.find(h => h.year === 2020)?.value || 0;
        const fore2030 = item.forecast.find(f => f.year === 2030)?.value || 0;

        switch (field) {
            case 'country': return item.country;
            case 'value2020': return hist2020;
            case 'value2030': return fore2030;
            case 'growth': return hist2020 ? (fore2030 - hist2020) / hist2020 : 0;
            case 'r_squared': return item.forecast[0]?.r_squared || 0;
            case 'volatility': return item.forecast[0]?.volatility || 0;
            default: return 0;
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const valA = getSortValue(a, sortField);
        const valB = getSortValue(b, sortField);

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const currentData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false); // Default descending for numbers
        }
    };

    const headerClass = "px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none";

    return (
        <div className="bg-white/80 rounded-xl border border-slate-200/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/80">
                        <tr>
                            <th onClick={() => handleSort('country')} className={headerClass}>Country</th>
                            <th onClick={() => handleSort('value2020')} className={headerClass}>2020 (Hist)</th>
                            <th onClick={() => handleSort('value2030')} className={headerClass}>2030 (Pred)</th>
                            <th onClick={() => handleSort('growth')} className={headerClass}>10y Growth</th>
                            <th onClick={() => handleSort('r_squared')} className={`${headerClass} text-right`}>Confidence (R²)</th>
                            <th onClick={() => handleSort('volatility')} className={`${headerClass} text-right`}>Volatility</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {currentData.map((item) => {
                            const hist2020 = item.historical.find(h => h.year === 2020)?.value;
                            const fore2030 = item.forecast.find(f => f.year === 2030);
                            const growth = hist2020 && fore2030 ? ((fore2030.value - hist2020) / hist2020) * 100 : 0;
                            const r2 = fore2030?.r_squared || 0;
                            const vol = fore2030?.volatility || 0;

                            return (
                                <tr key={item.country} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <Link href={`/countries/${item.country.toLowerCase().replace(/ /g, '_')}`} className="font-medium text-slate-900 hover:text-blue-600">
                                            {item.country}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                        {hist2020 ? formatValue(hist2020) : '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                                        {fore2030 ? formatValue(fore2030.value) : '-'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                        <span className={growth > 0 ? 'text-emerald-600' : 'text-red-500'}>
                                            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${r2 > 0.8 ? 'bg-emerald-100 text-emerald-700' : r2 > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {(r2 * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-500">
                                        {vol.toFixed(3)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, sortedData.length)} of {sortedData.length} entries
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 text-sm rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 text-sm rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}
