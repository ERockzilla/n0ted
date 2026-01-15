'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { detectAnomalies, getAnomalyStats, Anomaly } from '@/lib/anomalies';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

// SVG Icons
const BellIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
);

const XCircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
    </svg>
);

const GlobeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
    </svg>
);

const MapIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15"/><path d="M15 6v15"/>
    </svg>
);

const CheckCircleIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>
    </svg>
);

const InfoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
);

// Type icons
const SwordsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>
    </svg>
);

const TrendingDownIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
        <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>
    </svg>
);

const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
);

const ScaleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
);

const CreditCardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
);

const FlameIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
);

const SEVERITY_CONFIG = {
    critical: { color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200', label: 'Critical' },
    high: { color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', label: 'High' },
    medium: { color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Medium' },
    low: { color: '#65a30d', bg: 'bg-lime-50', border: 'border-lime-200', label: 'Low' },
};

const TYPE_CONFIG: Record<Anomaly['type'], { label: string; icon: React.ReactNode; description: string }> = {
    militarization: { 
        label: 'Militarization', 
        icon: <SwordsIcon />,
        description: 'Military spending significantly above regional norms'
    },
    economic_collapse: { 
        label: 'Economic Crisis', 
        icon: <TrendingDownIcon />,
        description: 'Severe GDP contraction or economic instability'
    },
    demographic_cliff: { 
        label: 'Demographic Cliff', 
        icon: <UsersIcon />,
        description: 'Population decline combined with aging demographics'
    },
    trade_imbalance: { 
        label: 'Trade Imbalance', 
        icon: <ScaleIcon />,
        description: 'Significant and sustained trade deficit'
    },
    debt_crisis: { 
        label: 'Debt Crisis', 
        icon: <CreditCardIcon />,
        description: 'External debt exceeding sustainable levels'
    },
    hyperinflation: { 
        label: 'Hyperinflation', 
        icon: <FlameIcon />,
        description: 'Extreme inflation eroding economic stability'
    },
};

export default function AlertsPage() {
    const [countries, setCountries] = useState<CountryData[]>([]);
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<Anomaly['type'] | 'all'>('all');
    const [filterSeverity, setFilterSeverity] = useState<Anomaly['severity'] | 'all'>('all');

    useEffect(() => {
        fetch('/api/countries')
            .then(r => r.json())
            .then(async (data) => {
                const countryPromises = data.countries.map((c: { file: string }) =>
                    fetch(`/api/countries/${c.file.replace('.json', '')}`).then(r => r.json())
                );
                const allCountries = await Promise.all(countryPromises);
                const validCountries = allCountries.filter(Boolean) as CountryData[];
                setCountries(validCountries);
                
                const detectedAnomalies = detectAnomalies(validCountries as any);
                setAnomalies(detectedAnomalies);
                
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const stats = getAnomalyStats(anomalies);

    const filteredAnomalies = anomalies.filter(a => {
        if (filterType !== 'all' && a.type !== filterType) return false;
        if (filterSeverity !== 'all' && a.severity !== filterSeverity) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-500 text-sm sm:text-base">Scanning for anomalies...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Anomaly Detection & Alerts</h1>
                    <p className="text-slate-500 text-sm sm:text-base">
                        Statistical detection of unusual patterns and potential risks
                    </p>
                </div>

                {/* Summary Stats */}
                <section className="mb-6 sm:mb-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard label="Total Alerts" value={stats.total.toString()} icon={<BellIcon />} color="slate" />
                        <StatCard label="Critical" value={stats.bySeverity.critical.toString()} icon={<XCircleIcon />} color="red" />
                        <StatCard label="Countries" value={stats.affectedCountries.toString()} icon={<GlobeIcon />} color="blue" />
                        <StatCard label="Regions" value={stats.affectedRegions.toString()} icon={<MapIcon />} color="violet" />
                    </div>
                </section>

                {/* Alert Types Overview - Scrollable on mobile */}
                <section className="mb-6 sm:mb-10">
                    <h2 className="text-sm sm:text-lg font-semibold text-slate-700 mb-3 sm:mb-4">Alert Types</h2>
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
                        {(Object.keys(TYPE_CONFIG) as Anomaly['type'][]).map(type => {
                            const config = TYPE_CONFIG[type];
                            const count = stats.byType[type];
                            const isActive = filterType === type;
                            
                            return (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(isActive ? 'all' : type)}
                                    className={`p-3 sm:p-4 rounded-xl border text-center transition-all flex-shrink-0 w-28 sm:w-auto ${
                                        isActive 
                                            ? 'border-blue-300 bg-blue-50'
                                            : count > 0
                                                ? 'border-slate-200 bg-white/80 hover:border-slate-300'
                                                : 'border-slate-100 bg-slate-50 opacity-50'
                                    }`}
                                >
                                    <div className="flex justify-center">{config.icon}</div>
                                    <p className="text-xs sm:text-sm text-slate-600 mt-2">{config.label}</p>
                                    <p className={`text-lg font-bold mt-1 ${count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {count}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Severity Filter - Scrollable on mobile */}
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
                    <span className="text-slate-500 text-xs sm:text-sm whitespace-nowrap">Severity:</span>
                    <button
                        onClick={() => setFilterSeverity('all')}
                        className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition whitespace-nowrap flex-shrink-0 ${
                            filterSeverity === 'all'
                                ? 'bg-slate-200 text-slate-800'
                                : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
                        }`}
                    >
                        All
                    </button>
                    {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
                        const config = SEVERITY_CONFIG[severity];
                        return (
                            <button
                                key={severity}
                                onClick={() => setFilterSeverity(filterSeverity === severity ? 'all' : severity)}
                                className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition whitespace-nowrap flex-shrink-0 ${
                                    filterSeverity === severity
                                        ? `${config.bg} ${config.border} border`
                                        : 'bg-white text-slate-500 hover:text-slate-700 border border-slate-200'
                                }`}
                                style={filterSeverity === severity ? { color: config.color } : {}}
                            >
                                {config.label} ({stats.bySeverity[severity]})
                            </button>
                        );
                    })}
                    
                    {(filterType !== 'all' || filterSeverity !== 'all') && (
                        <button
                            onClick={() => { setFilterType('all'); setFilterSeverity('all'); }}
                            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap py-2"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {/* Alerts List */}
                <section>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h2 className="text-sm sm:text-lg font-semibold text-slate-700">
                            {filterType !== 'all' ? TYPE_CONFIG[filterType].label : 'All'} Alerts
                            <span className="text-slate-500 font-normal ml-2">({filteredAnomalies.length})</span>
                        </h2>
                    </div>

                    {filteredAnomalies.length === 0 ? (
                        <div className="text-center py-12 sm:py-16 bg-white/80 rounded-xl border border-slate-200">
                            <CheckCircleIcon />
                            <p className="text-lg sm:text-xl text-slate-800 mt-4">No alerts match your filters</p>
                            <p className="text-slate-500 mt-2 text-sm">Try adjusting the filter criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                            {filteredAnomalies.map(anomaly => {
                                const severityConfig = SEVERITY_CONFIG[anomaly.severity];
                                const typeConfig = TYPE_CONFIG[anomaly.type];
                                
                                return (
                                    <div
                                        key={anomaly.id}
                                        className={`p-4 sm:p-5 rounded-xl border ${severityConfig.bg} ${severityConfig.border}`}
                                    >
                                        <div className="flex flex-col gap-3 sm:gap-4">
                                            <div className="flex items-start gap-3 sm:gap-4">
                                                <div className="flex-shrink-0 hidden sm:block">{typeConfig.icon}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{anomaly.title}</h3>
                                                        <span 
                                                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{ 
                                                                backgroundColor: `${severityConfig.color}20`,
                                                                color: severityConfig.color 
                                                            }}
                                                        >
                                                            {severityConfig.label}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs sm:text-sm">
                                                        <Link 
                                                            href={`/countries/${anomaly.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                            className="text-blue-600 hover:text-blue-700"
                                                        >
                                                            {anomaly.country}
                                                        </Link>
                                                        <span className="text-slate-500"> • {anomaly.region}</span>
                                                    </div>
                                                    <p className="text-slate-600 mt-2 text-xs sm:text-sm">
                                                        {anomaly.description}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-4 sm:gap-6 pt-2 border-t border-slate-200/50">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{anomaly.metric}</p>
                                                    <p className="text-lg sm:text-xl font-bold" style={{ color: severityConfig.color }}>
                                                        {anomaly.value}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Threshold</p>
                                                    <p className="text-sm text-slate-600">{anomaly.threshold}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Methodology Note */}
                <div className="mt-6 sm:mt-10 p-4 sm:p-6 rounded-xl bg-white/80 border border-slate-200 shadow-sm -mx-4 sm:mx-0 rounded-none sm:rounded-xl border-x-0 sm:border-x">
                    <div className="flex items-start gap-3 sm:gap-4">
                        <div className="flex-shrink-0"><InfoIcon /></div>
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-1 sm:mb-2 text-sm sm:text-base">About Anomaly Detection</h3>
                            <p className="text-slate-500 text-xs sm:text-sm">
                                Anomalies are detected using statistical analysis against regional and global baselines. 
                                A country triggers an alert when its indicators deviate significantly from expected norms 
                                (typically &gt;2 standard deviations). Severity is determined by the magnitude of deviation.
                            </p>
                            <Link
                                href="/methodology"
                                className="inline-block mt-2 sm:mt-3 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Learn more about our methodology →
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, icon, color }: { 
    label: string; 
    value: string; 
    icon: React.ReactNode; 
    color: 'slate' | 'red' | 'blue' | 'violet';
}) {
    const colorClasses = {
        slate: 'bg-slate-50 border-slate-200',
        red: 'bg-red-50 border-red-200',
        blue: 'bg-blue-50 border-blue-200',
        violet: 'bg-violet-50 border-violet-200',
    };

    return (
        <div className={`rounded-xl ${colorClasses[color]} border p-3 sm:p-5`}>
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{value}</p>
                    <p className="text-xs sm:text-sm text-slate-500">{label}</p>
                </div>
            </div>
        </div>
    );
}
