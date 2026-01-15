'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { detectAnomalies, getAnomalyStats, Anomaly } from '@/lib/anomalies';
import { 
    AlertTriangle, 
    Swords, 
    TrendingDown, 
    Users, 
    Scale, 
    CreditCard, 
    Flame,
    Bell,
    XCircle,
    Globe2,
    Map,
    CheckCircle,
    Info
} from 'lucide-react';

interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: Record<string, number | undefined>;
    economy: Record<string, number | undefined>;
    military: Record<string, number | undefined>;
    political: Record<string, string | undefined>;
}

const SEVERITY_CONFIG = {
    critical: { color: '#dc2626', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Critical' },
    high: { color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/30', label: 'High' },
    medium: { color: '#eab308', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', label: 'Medium' },
    low: { color: '#84cc16', bg: 'bg-lime-500/10', border: 'border-lime-500/30', label: 'Low' },
};

const TYPE_CONFIG: Record<Anomaly['type'], { label: string; icon: React.ReactNode; description: string }> = {
    militarization: { 
        label: 'Militarization', 
        icon: <Swords size={24} className="text-red-400" />,
        description: 'Military spending significantly above regional norms'
    },
    economic_collapse: { 
        label: 'Economic Crisis', 
        icon: <TrendingDown size={24} className="text-orange-400" />,
        description: 'Severe GDP contraction or economic instability'
    },
    demographic_cliff: { 
        label: 'Demographic Cliff', 
        icon: <Users size={24} className="text-purple-400" />,
        description: 'Population decline combined with aging demographics'
    },
    trade_imbalance: { 
        label: 'Trade Imbalance', 
        icon: <Scale size={24} className="text-yellow-400" />,
        description: 'Significant and sustained trade deficit'
    },
    debt_crisis: { 
        label: 'Debt Crisis', 
        icon: <CreditCard size={24} className="text-blue-400" />,
        description: 'External debt exceeding sustainable levels'
    },
    hyperinflation: { 
        label: 'Hyperinflation', 
        icon: <Flame size={24} className="text-red-500 icon-pulse" />,
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
            <div className="min-h-screen ">
                <Navigation />
                <div className="flex items-center justify-center h-[calc(100vh-80px)]">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400">Scanning for anomalies...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <Navigation />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Anomaly Detection & Alerts</h1>
                    <p className="text-slate-400">
                        Statistical detection of unusual patterns and potential risks across countries
                    </p>
                </div>

                {/* Summary Stats */}
                <section className="mb-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            label="Total Alerts"
                            value={stats.total.toString()}
                            icon={<Bell size={24} className="text-slate-400" />}
                            color="slate"
                        />
                        <StatCard
                            label="Critical"
                            value={stats.bySeverity.critical.toString()}
                            icon={<XCircle size={24} className="text-red-400" />}
                            color="red"
                        />
                        <StatCard
                            label="Countries Affected"
                            value={stats.affectedCountries.toString()}
                            icon={<Globe2 size={24} className="text-cyan-400" />}
                            color="cyan"
                        />
                        <StatCard
                            label="Regions Affected"
                            value={stats.affectedRegions.toString()}
                            icon={<Map size={24} className="text-purple-400" />}
                            color="purple"
                        />
                    </div>
                </section>

                {/* Alert Types Overview */}
                <section className="mb-10">
                    <h2 className="text-lg font-semibold text-slate-300 mb-4">Alert Types</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(Object.keys(TYPE_CONFIG) as Anomaly['type'][]).map(type => {
                            const config = TYPE_CONFIG[type];
                            const count = stats.byType[type];
                            const isActive = filterType === type;
                            
                            return (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(isActive ? 'all' : type)}
                                    className={`p-4 rounded-xl border text-center transition-all ${
                                        isActive 
                                            ? 'border-cyan-500/50 bg-cyan-500/10'
                                            : count > 0
                                                ? 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                                                : 'border-slate-800 bg-slate-900/30 opacity-50'
                                    }`}
                                >
                                    <div className="flex justify-center icon-animate">{config.icon}</div>
                                    <p className="text-sm text-slate-300 mt-2">{config.label}</p>
                                    <p className={`text-lg font-bold mt-1 ${count > 0 ? 'text-white' : 'text-slate-600'}`}>
                                        {count}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Severity Filter */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="text-slate-500 text-sm">Filter by severity:</span>
                    <button
                        onClick={() => setFilterSeverity('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm transition ${
                            filterSeverity === 'all'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white'
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
                                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                    filterSeverity === severity
                                        ? `${config.bg} ${config.border} border`
                                        : 'bg-slate-800/50 text-slate-400 hover:text-white'
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
                            className="ml-auto text-sm text-cyan-400 hover:text-cyan-300"
                        >
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Alerts List */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-300">
                            {filterType !== 'all' ? TYPE_CONFIG[filterType].label : 'All'} Alerts
                            <span className="text-slate-500 font-normal ml-2">({filteredAnomalies.length})</span>
                        </h2>
                    </div>

                    {filteredAnomalies.length === 0 ? (
                        <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                            <CheckCircle size={48} className="text-green-400 mx-auto icon-animate" />
                            <p className="text-xl text-white mt-4">No alerts match your filters</p>
                            <p className="text-slate-400 mt-2">Try adjusting the filter criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAnomalies.map(anomaly => {
                                const severityConfig = SEVERITY_CONFIG[anomaly.severity];
                                const typeConfig = TYPE_CONFIG[anomaly.type];
                                
                                return (
                                    <div
                                        key={anomaly.id}
                                        className={`p-5 rounded-xl border ${severityConfig.bg} ${severityConfig.border}`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="icon-animate">{typeConfig.icon}</div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-semibold text-white">{anomaly.title}</h3>
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
                                                    <Link 
                                                        href={`/countries/${anomaly.country.toLowerCase().replace(/\s+/g, '_')}`}
                                                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                                                    >
                                                        {anomaly.country}
                                                    </Link>
                                                    <span className="text-slate-500 text-sm"> • {anomaly.region}</span>
                                                    <p className="text-slate-400 mt-2 text-sm max-w-2xl">
                                                        {anomaly.description}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-6 md:text-right">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">{anomaly.metric}</p>
                                                    <p className="text-xl font-bold" style={{ color: severityConfig.color }}>
                                                        {anomaly.value}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Threshold</p>
                                                    <p className="text-sm text-slate-400">{anomaly.threshold}</p>
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
                <div className="mt-10 p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                    <div className="flex items-start gap-4">
                        <Info size={24} className="text-cyan-400 flex-shrink-0 icon-animate" />
                        <div>
                            <h3 className="font-semibold text-white mb-2">About Anomaly Detection</h3>
                            <p className="text-slate-400 text-sm">
                                Anomalies are detected using statistical analysis against regional and global baselines. 
                                A country triggers an alert when its indicators deviate significantly from expected norms 
                                (typically &gt;2 standard deviations). Severity is determined by the magnitude of deviation 
                                and potential impact. For multi-year trend detection, ingest additional Factbook editions.
                            </p>
                            <Link
                                href="/methodology"
                                className="inline-block mt-3 text-sm text-cyan-400 hover:text-cyan-300"
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
    color: 'slate' | 'red' | 'cyan' | 'purple';
}) {
    const colorClasses = {
        slate: 'from-slate-500/20 to-slate-600/10 border-slate-500/30',
        red: 'from-red-500/20 to-red-600/10 border-red-500/30',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
    };

    return (
        <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-5 backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
                <div className="icon-animate">{icon}</div>
                <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-slate-400">{label}</p>
                </div>
            </div>
        </div>
    );
}
