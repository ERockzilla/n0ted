'use client';

import React, { useState, useMemo } from 'react';

interface Column<T> {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    format?: (value: any, row: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    className?: string;
    headerClassName?: string;
}

interface SortableTableProps<T> {
    data: T[];
    columns: Column<T>[];
    rowKey: keyof T | ((row: T) => string);
    onRowClick?: (row: T) => void;
    className?: string;
    emptyMessage?: string;
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
}

const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => (
    <span className="inline-flex flex-col ml-1 opacity-60">
        <svg
            className={`w-2.5 h-2.5 -mb-1 ${direction === 'asc' ? 'text-blue-600' : 'text-slate-400'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M12 5l7 7H5z" />
        </svg>
        <svg
            className={`w-2.5 h-2.5 ${direction === 'desc' ? 'text-blue-600' : 'text-slate-400'}`}
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M12 19l-7-7h14z" />
        </svg>
    </span>
);

function getNestedValue<T>(obj: T, path: string): any {
    return path.split('.').reduce((acc: any, part) => acc?.[part], obj);
}

export default function SortableTable<T extends Record<string, any>>({
    data,
    columns,
    rowKey,
    onRowClick,
    className = '',
    emptyMessage = 'No data available',
    initialSortColumn,
    initialSortDirection = 'desc',
}: SortableTableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('desc');
        }
    };

    const sortedData = useMemo(() => {
        if (!sortColumn) return data;

        return [...data].sort((a, b) => {
            const aVal = getNestedValue(a, sortColumn);
            const bVal = getNestedValue(b, sortColumn);

            // Handle null/undefined - always push to bottom regardless of sort direction
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;  // a goes to bottom
            if (bVal == null) return -1; // b goes to bottom

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // String comparison
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            if (sortDirection === 'asc') {
                return aStr.localeCompare(bStr);
            }
            return bStr.localeCompare(aStr);
        });
    }, [data, sortColumn, sortDirection]);

    const getRowKey = (row: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(row);
        }
        return String(row[rowKey] ?? index);
    };

    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
    };

    return (
        <div className={`bg-white/90 rounded-xl border border-slate-200 overflow-hidden shadow-sm ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            {columns.map((col) => {
                                const isSortable = col.sortable !== false;
                                const isSorted = sortColumn === col.key;

                                return (
                                    <th
                                        key={String(col.key)}
                                        className={`py-3 px-4 text-slate-500 font-medium text-xs sm:text-sm ${alignClasses[col.align || 'left']
                                            } ${isSortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''} ${col.headerClassName || ''
                                            }`}
                                        onClick={() => isSortable && handleSort(String(col.key))}
                                    >
                                        <span className="inline-flex items-center">
                                            {col.label}
                                            {isSortable && (
                                                <SortIcon direction={isSorted ? sortDirection : null} />
                                            )}
                                        </span>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="py-12 text-center text-slate-400"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((row, idx) => (
                                <tr
                                    key={getRowKey(row, idx)}
                                    className={`border-b border-slate-100 hover:bg-slate-50 transition ${onRowClick ? 'cursor-pointer' : ''
                                        }`}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((col) => {
                                        const value = getNestedValue(row, String(col.key));
                                        const displayValue = col.format
                                            ? col.format(value, row)
                                            : value ?? 'N/A';

                                        return (
                                            <td
                                                key={String(col.key)}
                                                className={`py-3 px-4 text-sm ${alignClasses[col.align || 'left']
                                                    } ${col.className || ''}`}
                                            >
                                                {displayValue}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Export types for consumers
export type { Column, SortableTableProps };
