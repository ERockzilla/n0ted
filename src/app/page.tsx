import Link from 'next/link';
import { loadAllCountries, getRegions, formatNumber, formatPercent, formatBillions } from '@/lib/data';

export default function Home() {
  const countries = loadAllCountries(2010);
  const regions = getRegions(countries);

  // Calculate global stats
  const totalPopulation = countries.reduce((sum, c) => sum + (c.demographics.population || 0), 0);
  const totalGDP = countries.reduce((sum, c) => sum + (c.economy.gdp_ppp_billions || 0), 0);
  const avgGrowth = countries.filter(c => c.economy.gdp_growth_pct).reduce((sum, c, _, arr) =>
    sum + (c.economy.gdp_growth_pct || 0) / arr.length, 0);

  // Top countries by GDP
  const topByGDP = [...countries]
    .filter(c => c.economy.gdp_ppp_billions)
    .sort((a, b) => (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0))
    .slice(0, 10);

  // Countries with highest growth
  const topByGrowth = [...countries]
    .filter(c => c.economy.gdp_growth_pct)
    .sort((a, b) => (b.economy.gdp_growth_pct || 0) - (a.economy.gdp_growth_pct || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                🌍 GeoForecaster
              </h1>
              <p className="text-sm text-slate-400">CIA World Factbook Analysis • 2010</p>
            </div>
            <nav className="flex gap-6">
              <Link href="/" className="text-cyan-400 font-medium">Dashboard</Link>
              <Link href="/countries" className="text-slate-300 hover:text-white transition">Countries</Link>
              <Link href="/globe" className="text-slate-300 hover:text-white transition">Globe 3D</Link>
              <Link href="/compare" className="text-slate-300 hover:text-white transition">Compare</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Global Stats */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Global Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Countries Analyzed"
              value={countries.length.toString()}
              icon="🗺️"
              color="cyan"
            />
            <StatCard
              label="World Population"
              value={formatNumber(totalPopulation)}
              icon="👥"
              color="emerald"
            />
            <StatCard
              label="Global GDP (PPP)"
              value={formatBillions(totalGDP)}
              icon="💰"
              color="amber"
            />
            <StatCard
              label="Avg GDP Growth"
              value={formatPercent(avgGrowth)}
              icon="📈"
              color="purple"
            />
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Economies */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🏆 Largest Economies (GDP PPP)
            </h2>
            <div className="space-y-3">
              {topByGDP.map((country, i) => (
                <Link
                  key={country.country}
                  href={`/countries/${encodeURIComponent(country.country.toLowerCase().replace(/\s+/g, '_'))}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-400 transition">{country.country}</p>
                      <p className="text-xs text-slate-400">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">{formatBillions(country.economy.gdp_ppp_billions)}</p>
                    <p className="text-xs text-slate-400">
                      {country.economy.gdp_growth_pct ? `+${country.economy.gdp_growth_pct.toFixed(1)}% growth` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Fastest Growing */}
          <section className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              🚀 Fastest Growing Economies
            </h2>
            <div className="space-y-3">
              {topByGrowth.map((country, i) => (
                <Link
                  key={country.country}
                  href={`/countries/${encodeURIComponent(country.country.toLowerCase().replace(/\s+/g, '_'))}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-600 text-xs font-bold text-slate-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-400 transition">{country.country}</p>
                      <p className="text-xs text-slate-400">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">+{formatPercent(country.economy.gdp_growth_pct)}</p>
                    <p className="text-xs text-slate-400">
                      GDP: {formatBillions(country.economy.gdp_ppp_billions)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Region Breakdown */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Browse by Region</h2>
          <div className="flex flex-wrap gap-3">
            {regions.map(region => {
              const count = countries.filter(c => c.region === region).length;
              return (
                <Link
                  key={region}
                  href={`/countries?region=${encodeURIComponent(region)}`}
                  className="px-4 py-2 rounded-full bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-400 transition border border-slate-600/50"
                >
                  {region} <span className="text-slate-500 ml-1">({count})</span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
          Data extracted from CIA World Factbook 2010 • Built for geopolitical super-forecasting
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const colorClasses: Record<string, string> = {
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} border p-5`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
