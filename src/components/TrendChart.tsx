'use client';

import React, { useState } from 'react';

interface DataPoint {
    year: number;
    value: number;
    ci_low?: number;
    ci_high?: number;
    r_squared?: number;
    slope?: number;
}

interface TrendChartProps {
    title: string;
    historical: DataPoint[];
    forecast: DataPoint[];
    unit?: string;
    color?: string;
}

export default function TrendChart({ title, historical, forecast, unit = '', color = '#3b82f6' }: TrendChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

    // Combine for scaling and filter invalid points
    const allData = [...historical, ...forecast].filter(d =>
        typeof d.year === 'number' && !isNaN(d.year) &&
        typeof d.value === 'number' && !isNaN(d.value)
    );
    if (allData.length === 0) return null;

    // Get stats from forecast
    const forecastStats = forecast[0] || {};
    const r2 = forecastStats.r_squared;
    const slope = forecastStats.slope;

    // Dimensions
    const width = 600;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Scales
    const years = allData.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // Y-axis scaling with buffer
    const allValues = [
        ...allData.map(d => d.value),
        ...forecast.map(d => d.ci_high || d.value),
        ...forecast.map(d => d.ci_low || d.value)
    ];
    const minValue = Math.min(...allValues, 0);
    const maxValue = Math.max(...allValues);
    const yRange = maxValue - minValue;
    const yMin = minValue - (yRange * 0.1);
    const yMax = maxValue + (yRange * 0.1);

    const getX = (year: number) => {
        if (maxYear === minYear) return padding.left + (chartWidth / 2);
        return padding.left + ((year - minYear) / (maxYear - minYear)) * chartWidth;
    };
    const getY = (value: number) => {
        if (yMax === yMin) return padding.top + (chartHeight / 2);
        return padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
    };

    // Formatters
    const formatY = (val: number) => {
        if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
        if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(0)}k`;
        return val.toFixed(0);
    };

    // Path Generators
    const generatePath = (data: DataPoint[]) => {
        return data.map((d, i) =>
            `${i === 0 ? 'M' : 'L'} ${getX(d.year)} ${getY(d.value)}`
        ).join(' ');
    };

    const generateArea = (data: DataPoint[]) => {
        const upper = data.map(d => `${getX(d.year)} ${getY(d.ci_high || d.value)}`).join(' L ');
        const lower = data.slice().reverse().map(d => `${getX(d.year)} ${getY(d.ci_low || d.value)}`).join(' L ');
        return `M ${upper} L ${lower} Z`;
    };

    // Stitch connection between historical end and forecast start
    const lastHistorical = historical[historical.length - 1];
    const combinedForecast = [lastHistorical, ...forecast];

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-sm w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 font-semibold">{title}</h3>
                {r2 !== undefined && (
                    <div className="flex items-center gap-3 text-xs">
                        <span className={`px-2 py-1 rounded-full ${r2 > 0.8 ? 'bg-emerald-100 text-emerald-700' : r2 > 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            R² = {(r2 * 100).toFixed(0)}%
                        </span>
                        {slope !== undefined && (
                            <span className="text-slate-500">
                                Slope: {slope >= 0 ? '+' : ''}{formatY(slope)}/yr
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="relative w-full aspect-[2/1]">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(t => {
                        const y = padding.top + chartHeight * t;
                        const val = yMax - (yRange * 1.1) * t; // Approx
                        return (
                            <line
                                key={t}
                                x1={padding.left}
                                y1={y}
                                x2={width - padding.right}
                                y2={y}
                                stroke="#e2e8f0"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Y-Axis Labels */}
                    {[0, 0.5, 1].map(t => {
                        const val = yMin + (yMax - yMin) * t;
                        const y = getY(val);
                        return (
                            <text
                                key={t}
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                className="text-[10px] fill-slate-400"
                            >
                                {formatY(val)}
                            </text>
                        );
                    })}

                    {/* X-Axis Labels */}
                    {years.map(year => {
                        // Only show specific years to avoid crowding
                        if (allData.length > 5 && year % 5 !== 0) return null;
                        return (
                            <text
                                key={year}
                                x={getX(year)}
                                y={height - 5}
                                textAnchor="middle"
                                className="text-[10px] fill-slate-400 font-medium"
                            >
                                {year}
                            </text>
                        );
                    })}

                    {/* Confidence Interval Area */}
                    <path
                        d={generateArea(forecast)}
                        fill={color}
                        fillOpacity="0.1"
                    />

                    {/* Historical Line */}
                    <path
                        d={generatePath(historical)}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                    />

                    {/* Forecast Line (Dashed) */}
                    <path
                        d={generatePath(combinedForecast)}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        opacity="0.7"
                    />

                    {/* Points */}
                    {allData.map((d, i) => (
                        <circle
                            key={i}
                            cx={getX(d.year)}
                            cy={getY(d.value)}
                            r="4"
                            fill={d.year > 2020 ? '#ffffff' : color}
                            stroke={color}
                            strokeWidth="2"
                            className="transition-all duration-200 hover:r-6 cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(d)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    ))}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div
                        className="absolute bg-slate-800 text-white text-xs rounded px-2 py-1 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 z-10"
                        style={{
                            left: `${(getX(hoveredPoint.year) / width) * 100}%`,
                            top: `${(getY(hoveredPoint.value) / height) * 100}%`
                        }}
                    >
                        <p className="font-bold">{hoveredPoint.year}</p>
                        <p>{formatY(hoveredPoint.value)} {unit}</p>
                        {hoveredPoint.ci_low && (
                            <p className="text-slate-400 text-[9px]">
                                ±{formatY((hoveredPoint.value - hoveredPoint.ci_low))}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
