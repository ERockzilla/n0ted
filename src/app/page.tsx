import Link from 'next/link';
import { loadAllCountries, getRegions, formatNumber, formatPercent, formatBillions } from '@/lib/data';
import Navigation from '@/components/Navigation';

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
    <div className="min-h-screen">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Global Stats */}
        <section className="mb-10">
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Global Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Countries Analyzed"
              value={countries.length.toString()}
              color="blue"
            />
            <StatCard
              label="World Population"
              value={formatNumber(totalPopulation)}
              color="emerald"
            />
            <StatCard
              label="Global GDP (PPP)"
              value={formatBillions(totalGDP)}
              color="amber"
            />
            <StatCard
              label="Avg GDP Growth"
              value={formatPercent(avgGrowth)}
              color="violet"
            />
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Economies */}
          <section className="bg-white/80 rounded-xl p-6 border border-slate-200/80 backdrop-blur-sm shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Largest Economies (GDP PPP)
            </h2>
            <div className="space-y-1">
              {topByGDP.map((country, i) => (
                <Link
                  key={country.country}
                  href={`/countries/${encodeURIComponent(country.country.toLowerCase().replace(/\s+/g, '_'))}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium text-slate-400 bg-slate-100">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{country.country}</p>
                      <p className="text-xs text-slate-400">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatBillions(country.economy.gdp_ppp_billions)}</p>
                    <p className="text-xs text-slate-400">
                      {country.economy.gdp_growth_pct ? `${country.economy.gdp_growth_pct > 0 ? '+' : ''}${country.economy.gdp_growth_pct.toFixed(1)}%` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Fastest Growing */}
          <section className="bg-white/80 rounded-xl p-6 border border-slate-200/80 backdrop-blur-sm shadow-sm">
            <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              Fastest Growing Economies
            </h2>
            <div className="space-y-1">
              {topByGrowth.map((country, i) => (
                <Link
                  key={country.country}
                  href={`/countries/${encodeURIComponent(country.country.toLowerCase().replace(/\s+/g, '_'))}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium text-slate-400 bg-slate-100">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">{country.country}</p>
                      <p className="text-xs text-slate-400">{country.region}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">+{formatPercent(country.economy.gdp_growth_pct)}</p>
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
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Browse by Region</h2>
          <div className="flex flex-wrap gap-2">
            {regions.map(region => {
              const count = countries.filter(c => c.region === region).length;
              return (
                <Link
                  key={region}
                  href={`/countries?region=${encodeURIComponent(region)}`}
                  className="px-4 py-2 rounded-lg bg-white/80 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-slate-200/80 text-sm"
                >
                  {region} <span className="text-slate-400 ml-1">({count})</span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 mt-16 py-8 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          Data extracted from CIA World Factbook 2010 • Built for geopolitical super-forecasting
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: 'border-l-blue-500 bg-blue-50/50',
    emerald: 'border-l-emerald-500 bg-emerald-50/50',
    amber: 'border-l-amber-500 bg-amber-50/50',
    violet: 'border-l-violet-500 bg-violet-50/50',
  };

  const textColors: Record<string, string> = {
    blue: 'text-blue-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    violet: 'text-violet-700',
  };

  return (
    <div className={`rounded-lg ${colorClasses[color]} border border-slate-200/60 border-l-4 p-5 backdrop-blur-sm`}>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}
