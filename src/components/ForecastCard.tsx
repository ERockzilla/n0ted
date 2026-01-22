'use client';

interface ForecastData {
    value: number;
    ci_low: number;
    ci_high: number;
}

interface ForecastCardProps {
    title: string;
    currentValue: number;
    prediction2030: ForecastData;
    unit?: string;
    icon?: React.ReactNode;
}

export default function ForecastCard({ title, currentValue, prediction2030, unit = '', icon }: ForecastCardProps) {
    const change = prediction2030.value - currentValue;
    const pctChange = (change / currentValue) * 100;
    const isPositive = change >= 0;

    const formatValue = (val: number) => {
        if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
        if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
        if (Math.abs(val) >= 1e3) return `${(val / 1e3).toFixed(1)}k`;
        return val.toFixed(1);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
                        <p className="text-2xl font-bold text-slate-800">
                            {formatValue(currentValue)}{unit}
                        </p>
                        <span className="text-xs text-slate-400">Current (2020)</span>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-semibold text-slate-700">2030 Forecast</span>
                    <span className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? '↗' : '↘'} {Math.abs(pctChange).toFixed(1)}%
                    </span>
                </div>

                <p className="text-xl font-bold text-slate-800">
                    {formatValue(prediction2030.value)}{unit}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    Range: {formatValue(prediction2030.ci_low)} - {formatValue(prediction2030.ci_high)}
                </p>
            </div>
        </div>
    );
}
