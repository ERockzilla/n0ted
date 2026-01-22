'use client';

import React from 'react';

interface MiniSparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    showFill?: boolean;
}

const MiniSparkline = React.memo(function MiniSparkline({
    data,
    width = 60,
    height = 20,
    color = '#3b82f6',
    showFill = true
}: MiniSparklineProps) {
    if (!data || data.length < 2) {
        return (
            <div
                className="bg-slate-200/50 rounded"
                style={{ width, height }}
            />
        );
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const padding = 2;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const points = data.map((value, i) => {
        const x = padding + (i / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        return `${x},${y}`;
    }).join(' ');

    const fillPath = `M ${padding},${padding + chartHeight} L ${points} L ${width - padding},${padding + chartHeight} Z`;
    const linePath = `M ${points.split(' ').join(' L ')}`.replace('M L', 'M');

    // Trend direction for color adjustment
    const trend = data[data.length - 1] > data[0] ? 'up' : 'down';
    const trendColor = trend === 'up' ? '#10b981' : '#ef4444';

    return (
        <svg
            width={width}
            height={height}
            className="overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
        >
            {showFill && (
                <path
                    d={fillPath}
                    fill={`${color}20`}
                />
            )}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* End point dot */}
            <circle
                cx={width - padding}
                cy={padding + chartHeight - ((data[data.length - 1] - min) / range) * chartHeight}
                r="2"
                fill={trendColor}
            />
        </svg>
    );
});

export default MiniSparkline;
