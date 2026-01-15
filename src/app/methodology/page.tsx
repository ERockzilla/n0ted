import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { 
    BookOpen, 
    Settings, 
    BarChart3, 
    Target, 
    Calendar, 
    RefreshCw, 
    FileText,
    AlertTriangle
} from 'lucide-react';

export default function MethodologyPage() {
    return (
        <div className="min-h-screen ">
            <Navigation />

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-white mb-4">Methodology</h1>
                    <p className="text-xl text-slate-400">
                        Understanding our data sources, extraction processes, and analytical frameworks.
                    </p>
                </div>

                {/* Data Source */}
                <Section title="Data Source" id="source" icon={<BookOpen size={24} className="text-cyan-400" />}>
                    <p className="text-slate-300 mb-4">
                        GeoForecaster exclusively uses data from the <strong className="text-white">CIA World Factbook</strong>, 
                        a comprehensive reference resource produced by the Central Intelligence Agency with information on 
                        the history, people, government, economy, energy, geography, environment, communications, 
                        transportation, military, terrorism, and transnational issues for 267 world entities.
                    </p>
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 my-6">
                        <h4 className="font-semibold text-white mb-2">Public Domain Notice</h4>
                        <p className="text-sm text-slate-400">
                            The World Factbook is in the public domain and may be used freely by anyone at anytime 
                            without seeking permission. However, US Government photographs from the Factbook are 
                            generally not copyrightable.
                        </p>
                    </div>
                    <p className="text-slate-300">
                        Currently, GeoForecaster has processed the <strong className="text-cyan-400">2010 edition</strong>. 
                        Multi-year trend analysis requires additional historical editions to be ingested.
                    </p>
                </Section>

                {/* Extraction Process */}
                <Section title="Data Extraction" id="extraction" icon={<Settings size={24} className="text-purple-400" />}>
                    <p className="text-slate-300 mb-4">
                        Raw Factbook data is extracted using a custom Python script that parses HTML editions 
                        and transforms unstructured text into normalized JSON records.
                    </p>
                    
                    <h4 className="font-semibold text-white mt-6 mb-3">Extraction Pipeline</h4>
                    <div className="space-y-3">
                        <Step number={1} title="HTML Parsing">
                            Stream-process large HTML files (~18MB) to extract country sections
                        </Step>
                        <Step number={2} title="Field Extraction">
                            Regular expressions identify and parse specific data fields 
                            (GDP, population, military spending, etc.)
                        </Step>
                        <Step number={3} title="Normalization">
                            Convert varied formats (e.g., &quot;$14.2 trillion&quot;, &quot;14,200 billion&quot;) 
                            to consistent numeric values
                        </Step>
                        <Step number={4} title="JSON Output">
                            Generate per-country JSON files with standardized schema
                        </Step>
                    </div>

                    <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/30 mt-6">
                        <h4 className="font-semibold text-amber-400 mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Data Limitations
                        </h4>
                        <ul className="text-sm text-slate-300 space-y-2 list-disc list-inside">
                            <li>Estimates may vary from other sources due to differing methodologies</li>
                            <li>Some fields may be unavailable for certain countries</li>
                            <li>Data reflects the publication year, not real-time information</li>
                            <li>Small territories and dependencies may have incomplete records</li>
                        </ul>
                    </div>
                </Section>

                {/* Metrics Explained */}
                <Section title="Key Metrics" id="metrics" icon={<BarChart3 size={24} className="text-emerald-400" />}>
                    <div className="grid gap-4">
                        <MetricExplainer
                            name="GDP (PPP)"
                            unit="Billions USD"
                            description="Gross Domestic Product measured at Purchasing Power Parity. PPP adjusts for price differences between countries, providing a more accurate comparison of actual economic output and living standards."
                        />
                        <MetricExplainer
                            name="GDP Growth"
                            unit="Percentage"
                            description="Annual percentage growth rate of GDP at market prices based on constant local currency. A positive rate indicates economic expansion."
                        />
                        <MetricExplainer
                            name="Military Expenditure"
                            unit="% of GDP"
                            description="Military spending as a share of gross domestic product. Higher percentages may indicate regional tensions, defense priorities, or geopolitical ambitions."
                        />
                        <MetricExplainer
                            name="Trade Balance"
                            unit="Billions USD"
                            description="Exports minus imports. A positive balance (surplus) indicates a country exports more than it imports; negative (deficit) indicates the reverse."
                        />
                        <MetricExplainer
                            name="Population Growth"
                            unit="Percentage"
                            description="Annual population growth rate accounting for births, deaths, and net migration. Negative growth may indicate demographic challenges."
                        />
                    </div>
                </Section>

                {/* Risk Index */}
                <Section title="Composite Risk Index" id="risk-index" icon={<Target size={24} className="text-red-400" />}>
                    <p className="text-slate-300 mb-6">
                        Our Risk/Stability Index aggregates multiple indicators into a single composite score 
                        for each country, enabling quick assessment of geopolitical risk.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <IndexComponent
                            name="Economic Stability"
                            weight="30%"
                            factors={['GDP growth rate', 'Inflation rate', 'Unemployment rate', 'External debt ratio']}
                            color="emerald"
                        />
                        <IndexComponent
                            name="Political Risk"
                            weight="25%"
                            factors={['Leadership tenure', 'Election cycle proximity', 'Government type stability']}
                            color="purple"
                        />
                        <IndexComponent
                            name="Military Tension"
                            weight="25%"
                            factors={['Military spending % GDP', 'Regional military context', 'Historical conflicts']}
                            color="red"
                        />
                        <IndexComponent
                            name="Demographic Pressure"
                            weight="20%"
                            factors={['Population growth', 'Median age', 'Urbanization rate', 'Life expectancy']}
                            color="blue"
                        />
                    </div>

                    <p className="text-sm text-slate-500 mt-6">
                        * Index calculations use z-score normalization against global and regional baselines. 
                        Higher scores indicate greater stability.
                    </p>
                </Section>

                {/* Adding More Years */}
                <Section title="Multi-Year Analysis" id="multi-year" icon={<Calendar size={24} className="text-blue-400" />}>
                    <p className="text-slate-300 mb-4">
                        Full time-series trend analysis requires ingesting multiple Factbook editions. 
                        The system is designed to seamlessly incorporate additional years.
                    </p>

                    <h4 className="font-semibold text-white mt-6 mb-3">Recommended Historical Editions</h4>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                        <YearCard year="2000" label="Pre-9/11 Baseline" />
                        <YearCard year="2010" label="Post-Crisis Recovery" active />
                        <YearCard year="2020" label="Pre-Pandemic Peak" />
                    </div>

                    <h4 className="font-semibold text-white mt-8 mb-3">Ingestion Workflow</h4>
                    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 font-mono text-sm">
                        <p className="text-slate-400 mb-2"># 1. Download HTML factbook (Project Gutenberg or CIA Archives)</p>
                        <p className="text-cyan-400 mb-4">wget https://www.gutenberg.org/files/.../factbook_2000.html</p>
                        
                        <p className="text-slate-400 mb-2"># 2. Run extraction script</p>
                        <p className="text-cyan-400 mb-4">python extract_factbook.py factbook_2000.html --year 2000</p>
                        
                        <p className="text-slate-400 mb-2"># 3. Merge time-series data</p>
                        <p className="text-cyan-400 mb-4">python merge_timeseries.py</p>
                        
                        <p className="text-slate-400 mb-2"># 4. Restart application to load new data</p>
                        <p className="text-cyan-400">npm run dev</p>
                    </div>

                    <p className="text-slate-400 mt-4 text-sm">
                        After ingestion, the application automatically detects available years and enables 
                        time-series visualizations in the Trends and Analysis pages.
                    </p>
                </Section>

                {/* Update Frequency */}
                <Section title="Update Frequency" id="updates" icon={<RefreshCw size={24} className="text-amber-400" />}>
                    <p className="text-slate-300">
                        The CIA World Factbook is updated continuously throughout the year, with major 
                        releases typically occurring annually. This platform processes static snapshots 
                        of historical editions rather than live data feeds.
                    </p>
                    <p className="text-slate-300 mt-4">
                        For real-time geopolitical intelligence, users should supplement GeoForecaster 
                        with authoritative news sources and official government publications.
                    </p>
                </Section>

                {/* Attribution */}
                <Section title="Attribution & License" id="license" icon={<FileText size={24} className="text-slate-400" />}>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <h4 className="font-semibold text-white mb-2">Data</h4>
                            <p className="text-slate-300 text-sm">
                                CIA World Factbook
                            </p>
                            <p className="text-slate-500 text-xs mt-1">Public Domain</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                            <h4 className="font-semibold text-white mb-2">Application Code</h4>
                            <p className="text-slate-300 text-sm">
                                GeoForecaster Platform
                            </p>
                            <p className="text-slate-500 text-xs mt-1">MIT License</p>
                        </div>
                    </div>
                </Section>

                {/* Back */}
                <div className="mt-12 pt-8 border-t border-slate-700/50">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}

function Section({ title, id, icon, children }: { title: string; id: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section id={id} className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {icon}
                {title}
            </h2>
            {children}
        </section>
    );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {number}
            </div>
            <div>
                <h5 className="font-medium text-white">{title}</h5>
                <p className="text-sm text-slate-400">{children}</p>
            </div>
        </div>
    );
}

function MetricExplainer({ name, unit, description }: { name: string; unit: string; description: string }) {
    return (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white">{name}</h4>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">{unit}</span>
            </div>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    );
}

function IndexComponent({ name, weight, factors, color }: { 
    name: string; 
    weight: string; 
    factors: string[];
    color: 'emerald' | 'purple' | 'red' | 'blue';
}) {
    const colorClasses = {
        emerald: 'border-emerald-500/30 bg-emerald-500/5',
        purple: 'border-purple-500/30 bg-purple-500/5',
        red: 'border-red-500/30 bg-red-500/5',
        blue: 'border-blue-500/30 bg-blue-500/5',
    };

    const textColors = {
        emerald: 'text-emerald-400',
        purple: 'text-purple-400',
        red: 'text-red-400',
        blue: 'text-blue-400',
    };

    return (
        <div className={`rounded-xl p-5 border ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-3">
                <h4 className={`font-semibold ${textColors[color]}`}>{name}</h4>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-400">{weight}</span>
            </div>
            <ul className="text-sm text-slate-400 space-y-1">
                {factors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function YearCard({ year, label, active = false }: { year: string; label: string; active?: boolean }) {
    return (
        <div className={`rounded-xl p-4 border text-center ${
            active 
                ? 'border-cyan-500/50 bg-cyan-500/10' 
                : 'border-slate-700/50 bg-slate-800/30'
        }`}>
            <p className={`text-2xl font-bold ${active ? 'text-cyan-400' : 'text-slate-400'}`}>{year}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
            {active && <span className="inline-block mt-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">Loaded</span>}
        </div>
    );
}
