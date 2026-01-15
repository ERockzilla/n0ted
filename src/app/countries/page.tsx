import Link from 'next/link';
import { loadAllCountries, getRegions, formatNumber, formatPercent, formatBillions } from '@/lib/data';

interface PageProps {
    searchParams: Promise<{ region?: string; sort?: string }>;
}

export default async function CountriesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const allCountries = loadAllCountries(2010);
    const regions = getRegions(allCountries);

    // Filter by region if specified
    let countries = params.region
        ? allCountries.filter(c => c.region === params.region)
        : allCountries;

    // Sort
    const sortBy = params.sort || 'name';
    countries = [...countries].sort((a, b) => {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                🌍 GeoForecaster
                            </Link>
                            <p className="text-sm text-slate-400">CIA World Factbook Analysis • 2010</p>
                        </div>
                        <nav className="flex gap-6">
                            <Link href="/" className="text-slate-300 hover:text-white transition">Dashboard</Link>
                            <Link href="/countries" className="text-cyan-400 font-medium">Countries</Link>
                            <Link href="/compare" className="text-slate-300 hover:text-white transition">Compare</Link>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            {params.region ? params.region : 'All Countries'}
                        </h1>
                        <p className="text-slate-400">{countries.length} countries</p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <select
                            className="px-4 py-2 rounded-lg bg-slate-700 text-white border border-slate-600"
                            defaultValue={sortBy}
                            onChange={(e) => {
                                const url = new URL(window.location.href);
                                url.searchParams.set('sort', e.target.value);
                                window.location.href = url.toString();
                            }}
                        >
                            <option value="name">Sort by Name</option>
                            <option value="gdp">Sort by GDP</option>
                            <option value="population">Sort by Population</option>
                            <option value="growth">Sort by GDP Growth</option>
                        </select>
                    </div>
                </div>

                {/* Region Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-8">
                    <Link
                        href="/countries"
                        className={`px-4 py-2 rounded-full text-sm transition ${!params.region
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                            }`}
                    >
                        All
                    </Link>
                    {regions.map(region => (
                        <Link
                            key={region}
                            href={`/countries?region=${encodeURIComponent(region)}${sortBy !== 'name' ? `&sort=${sortBy}` : ''}`}
                            className={`px-4 py-2 rounded-full text-sm transition ${params.region === region
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {region}
                        </Link>
                    ))}
                </div>

                {/* Country Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {countries.map(country => (
                        <Link
                            key={country.country}
                            href={`/countries/${encodeURIComponent(country.country.toLowerCase().replace(/\s+/g, '_'))}`}
                            className="group p-5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition">
                                        {country.country}
                                    </h3>
                                    <p className="text-sm text-slate-400">{country.region}</p>
                                </div>
                                {country.economy.gdp_growth_pct && (
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${country.economy.gdp_growth_pct > 0
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {country.economy.gdp_growth_pct > 0 ? '+' : ''}{country.economy.gdp_growth_pct.toFixed(1)}%
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Population</p>
                                    <p className="font-medium text-slate-200">{formatNumber(country.demographics.population)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">GDP (PPP)</p>
                                    <p className="font-medium text-slate-200">{formatBillions(country.economy.gdp_ppp_billions)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500">GDP/Capita</p>
                                    <p className="font-medium text-slate-200">
                                        {country.economy.gdp_per_capita ? `$${country.economy.gdp_per_capita.toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-500">Unemployment</p>
                                    <p className="font-medium text-slate-200">{formatPercent(country.economy.unemployment_pct)}</p>
                                </div>
                            </div>

                            {country.political.chief_of_state && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                    <p className="text-xs text-slate-500">Leader</p>
                                    <p className="text-sm text-slate-300 truncate">{country.political.chief_of_state}</p>
                                </div>
                            )}
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
