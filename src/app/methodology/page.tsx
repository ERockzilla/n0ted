import Link from 'next/link';
import Navigation from '@/components/Navigation';

// SVG Icons
const BookOpenIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
);

const SettingsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
    </svg>
);

const BarChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16h8"/><path d="M7 11h12"/><path d="M7 6h3"/>
    </svg>
);

const TargetIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
);

const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/>
        <path d="M3 10h18"/>
    </svg>
);

const RefreshIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
        <path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
        <path d="M8 16H3v5"/>
    </svg>
);

const FileTextIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </svg>
);

const AlertTriangleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
        <path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
);

export default function MethodologyPage() {
    return (
        <div className="min-h-screen">
            <Navigation />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-3 sm:mb-4">Methodology</h1>
                    <p className="text-base sm:text-xl text-slate-500">
                        Understanding our data sources, extraction processes, and analytical frameworks.
                    </p>
                </div>

                {/* Data Source */}
                <Section title="Data Source" id="source" icon={<BookOpenIcon />}>
                    <p className="text-slate-600 mb-4 text-sm sm:text-base">
                        GeoForecaster exclusively uses data from the <strong className="text-slate-800">CIA World Factbook</strong>, 
                        a comprehensive reference resource produced by the Central Intelligence Agency with information on 
                        the history, people, government, economy, energy, geography, environment, communications, 
                        transportation, military, terrorism, and transnational issues for 267 world entities.
                    </p>
                    <div className="bg-blue-50 rounded-xl p-4 sm:p-5 border border-blue-200 my-4 sm:my-6">
                        <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Public Domain Notice</h4>
                        <p className="text-xs sm:text-sm text-slate-600">
                            The World Factbook is in the public domain and may be used freely by anyone at anytime 
                            without seeking permission. However, US Government photographs from the Factbook are 
                            generally not copyrightable.
                        </p>
                    </div>
                    <p className="text-slate-600 text-sm sm:text-base">
                        Currently, GeoForecaster has processed the <strong className="text-blue-600">2010 edition</strong>. 
                        Multi-year trend analysis requires additional historical editions to be ingested.
                    </p>
                </Section>

                {/* Extraction Process */}
                <Section title="Data Extraction" id="extraction" icon={<SettingsIcon />}>
                    <p className="text-slate-600 mb-4 text-sm sm:text-base">
                        Raw Factbook data is extracted using a custom Python script that parses HTML editions 
                        and transforms unstructured text into normalized JSON records.
                    </p>
                    
                    <h4 className="font-semibold text-slate-800 mt-6 mb-3 text-sm sm:text-base">Extraction Pipeline</h4>
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

                    <div className="bg-amber-50 rounded-xl p-4 sm:p-5 border border-amber-200 mt-6">
                        <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                            <AlertTriangleIcon />
                            Data Limitations
                        </h4>
                        <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc list-inside">
                            <li>Estimates may vary from other sources due to differing methodologies</li>
                            <li>Some fields may be unavailable for certain countries</li>
                            <li>Data reflects the publication year, not real-time information</li>
                            <li>Small territories and dependencies may have incomplete records</li>
                        </ul>
                    </div>
                </Section>

                {/* Metrics Explained */}
                <Section title="Key Metrics" id="metrics" icon={<BarChartIcon />}>
                    <div className="grid gap-3 sm:gap-4">
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
                <Section title="Composite Risk Index" id="risk-index" icon={<TargetIcon />}>
                    <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        Our Risk/Stability Index aggregates multiple indicators into a single composite score 
                        for each country, enabling quick assessment of geopolitical risk.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
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
                            color="violet"
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

                    <p className="text-xs sm:text-sm text-slate-500 mt-4 sm:mt-6">
                        * Index calculations use z-score normalization against global and regional baselines. 
                        Higher scores indicate greater stability.
                    </p>
                </Section>

                {/* Adding More Years */}
                <Section title="Multi-Year Analysis" id="multi-year" icon={<CalendarIcon />}>
                    <p className="text-slate-600 mb-4 text-sm sm:text-base">
                        Full time-series trend analysis requires ingesting multiple Factbook editions. 
                        The system is designed to seamlessly incorporate additional years.
                    </p>

                    <h4 className="font-semibold text-slate-800 mt-6 mb-3 text-sm sm:text-base">Recommended Historical Editions</h4>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                        <YearCard year="2000" label="Pre-9/11" />
                        <YearCard year="2010" label="Post-Crisis" active />
                        <YearCard year="2020" label="Pre-Pandemic" />
                    </div>

                    <h4 className="font-semibold text-slate-800 mt-8 mb-3 text-sm sm:text-base">Ingestion Workflow</h4>
                    <div className="bg-slate-100 rounded-xl p-4 sm:p-5 font-mono text-xs sm:text-sm overflow-x-auto">
                        <p className="text-slate-500 mb-2"># 1. Download HTML factbook</p>
                        <p className="text-blue-600 mb-4 whitespace-nowrap">wget https://www.gutenberg.org/files/.../factbook_2000.html</p>
                        
                        <p className="text-slate-500 mb-2"># 2. Run extraction script</p>
                        <p className="text-blue-600 mb-4 whitespace-nowrap">python extract_factbook.py factbook_2000.html --year 2000</p>
                        
                        <p className="text-slate-500 mb-2"># 3. Merge time-series data</p>
                        <p className="text-blue-600 mb-4">python merge_timeseries.py</p>
                        
                        <p className="text-slate-500 mb-2"># 4. Restart application</p>
                        <p className="text-blue-600">npm run dev</p>
                    </div>

                    <p className="text-slate-500 mt-4 text-xs sm:text-sm">
                        After ingestion, the application automatically detects available years and enables 
                        time-series visualizations in the Trends and Analysis pages.
                    </p>
                </Section>

                {/* Update Frequency */}
                <Section title="Update Frequency" id="updates" icon={<RefreshIcon />}>
                    <p className="text-slate-600 text-sm sm:text-base">
                        The CIA World Factbook is updated continuously throughout the year, with major 
                        releases typically occurring annually. This platform processes static snapshots 
                        of historical editions rather than live data feeds.
                    </p>
                    <p className="text-slate-600 mt-4 text-sm sm:text-base">
                        For real-time geopolitical intelligence, users should supplement GeoForecaster 
                        with authoritative news sources and official government publications.
                    </p>
                </Section>

                {/* Attribution */}
                <Section title="Attribution & License" id="license" icon={<FileTextIcon />}>
                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Data</h4>
                            <p className="text-slate-600 text-sm">CIA World Factbook</p>
                            <p className="text-slate-400 text-xs mt-1">Public Domain</p>
                        </div>
                        <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">Application Code</h4>
                            <p className="text-slate-600 text-sm">GeoForecaster Platform</p>
                            <p className="text-slate-400 text-xs mt-1">MIT License</p>
                        </div>
                    </div>
                </Section>

                {/* Back */}
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-sm"
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
        <section id={id} className="mb-8 sm:mb-12 scroll-mt-24">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                {icon}
                {title}
            </h2>
            {children}
        </section>
    );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-3 sm:gap-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                {number}
            </div>
            <div>
                <h5 className="font-medium text-slate-800 text-sm sm:text-base">{title}</h5>
                <p className="text-xs sm:text-sm text-slate-500">{children}</p>
            </div>
        </div>
    );
}

function MetricExplainer({ name, unit, description }: { name: string; unit: string; description: string }) {
    return (
        <div className="bg-white/80 rounded-xl p-4 sm:p-5 border border-slate-200">
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-800 text-sm sm:text-base">{name}</h4>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{unit}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">{description}</p>
        </div>
    );
}

function IndexComponent({ name, weight, factors, color }: { 
    name: string; 
    weight: string; 
    factors: string[];
    color: 'emerald' | 'violet' | 'red' | 'blue';
}) {
    const colorClasses = {
        emerald: 'border-emerald-200 bg-emerald-50',
        violet: 'border-violet-200 bg-violet-50',
        red: 'border-red-200 bg-red-50',
        blue: 'border-blue-200 bg-blue-50',
    };

    const textColors = {
        emerald: 'text-emerald-700',
        violet: 'text-violet-700',
        red: 'text-red-700',
        blue: 'text-blue-700',
    };

    return (
        <div className={`rounded-xl p-4 sm:p-5 border ${colorClasses[color]}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className={`font-semibold text-sm sm:text-base ${textColors[color]}`}>{name}</h4>
                <span className="text-xs bg-white/80 px-2 py-1 rounded text-slate-500">{weight}</span>
            </div>
            <ul className="text-xs sm:text-sm text-slate-600 space-y-1">
                {factors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-slate-400" />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function YearCard({ year, label, active = false }: { year: string; label: string; active?: boolean }) {
    return (
        <div className={`rounded-xl p-3 sm:p-4 border text-center ${
            active 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-slate-200 bg-white/80'
        }`}>
            <p className={`text-xl sm:text-2xl font-bold ${active ? 'text-blue-600' : 'text-slate-400'}`}>{year}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
            {active && <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Loaded</span>}
        </div>
    );
}
