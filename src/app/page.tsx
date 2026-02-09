'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import SortableTable, { Column } from '@/components/SortableTable';
import LoadingSpinner from '@/components/LoadingSpinner';

// Aggregate entities to exclude from calculations to prevent double-counting
const AGGREGATE_ENTITIES = ['World', 'European Union'];

interface CountryData {
  country: string;
  region: string;
  demographics: {
    population?: number;
    life_expectancy?: number;
  };
  economy: {
    gdp_ppp_billions?: number;
    gdp_growth_pct?: number;
    inflation_pct?: number;
  };
  military?: {
    expenditure_pct_gdp?: number;
  };
  calculatedGrowth?: number;
}

interface TimeSeriesData {
  [country: string]: {
    [metric: string]: Array<{ year: number; value: number }>;
  };
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || n === null) return 'N/A';
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(1);
}

function formatPercent(n: number | undefined): string {
  if (n === undefined || n === null) return 'N/A';
  return `${n.toFixed(1)}%`;
}

function formatBillions(n: number | undefined): string {
  if (n === undefined || n === null) return 'N/A';
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
  return `$${n.toFixed(1)}B`;
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [availableYears, setAvailableYears] = useState<number[]>([2020]);
  const [selectedYear, setSelectedYear] = useState<number>(2020);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [timeseries, setTimeseries] = useState<TimeSeriesData>({});
  const [regions, setRegions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize year from URL params
  useEffect(() => {
    const yearParam = searchParams.get('year');
    if (yearParam) {
      const year = parseInt(yearParam);
      if (!isNaN(year)) {
        setSelectedYear(year);
      }
    }
  }, [searchParams]);

  // Fetch available years and data
  useEffect(() => {
    Promise.all([
      fetch('/api/years').then(r => r.json()).catch(() => ({ years: [2020] })),
      fetch('/api/countries/timeseries').then(r => r.json()).catch(() => ({ data: {} }))
    ]).then(([yearsData, tsData]) => {
      if (yearsData.years?.length > 0) {
        setAvailableYears(yearsData.years.sort((a: number, b: number) => b - a));
      }
      if (tsData.data) {
        setTimeseries(tsData.data);
      }
    });
  }, []);

  // Fetch countries for selected year
  useEffect(() => {
    setLoading(true);
    fetch(`/api/countries?year=${selectedYear}`)
      .then(r => r.json())
      .then(async (indexData) => {
        if (!indexData.countries) {
          setCountries([]);
          setLoading(false);
          return;
        }

        const countryPromises = indexData.countries.map((c: { file: string }) =>
          fetch(`/api/countries/${c.file.replace('.json', '')}?year=${selectedYear}`)
            .then(r => r.json())
            .catch(() => null)
        );
        const allCountries = await Promise.all(countryPromises);
        const validCountries = allCountries.filter(Boolean) as CountryData[];

        // Filter out aggregates
        const realCountries = validCountries.filter(c => !AGGREGATE_ENTITIES.includes(c.country));

        // Extract regions
        const uniqueRegions = [...new Set(realCountries.map(c => c.region))].filter(r => r !== 'World').sort();
        setRegions(uniqueRegions);

        // Enhance with calculated growth
        const enhanced = realCountries.map(c => {
          // Use the GDP from the API response (already year-specific)
          let gdpValue = c.economy?.gdp_ppp_billions || 0;
          // Default growth from the API, or 0
          let growth = c.economy?.gdp_growth_pct || 0;

          const key = c.country.toLowerCase().replace(/\s+/g, '_');
          const ts = timeseries[key];

          // Try to calculate growth from timeseries if available
          if (ts?.gdp_ppp_billions && Array.isArray(ts.gdp_ppp_billions)) {
            const points = [...ts.gdp_ppp_billions].sort((a, b) => a.year - b.year);
            const currentYearData = points.find(p => p.year === selectedYear);

            // If we have timeseries data for this year, use it for GDP if API didn't provide it
            if (currentYearData) {
              if (!gdpValue) gdpValue = currentYearData.value;

              // Find previous year data for growth calculation
              const previousYearData = points
                .filter(p => p.year < selectedYear && p.year >= selectedYear - 5)
                .sort((a, b) => b.year - a.year)[0];

              if (previousYearData && previousYearData.value > 0) {
                const yearsDiff = selectedYear - previousYearData.year;
                if (yearsDiff > 0) {
                  growth = (Math.pow(currentYearData.value / previousYearData.value, 1 / yearsDiff) - 1) * 100;
                }
              }
            } else {
              // No exact year match - try to find closest available year
              const closestPoint = points
                .filter(p => Math.abs(p.year - selectedYear) <= 2)
                .sort((a, b) => Math.abs(a.year - selectedYear) - Math.abs(b.year - selectedYear))[0];

              if (closestPoint && !gdpValue) {
                gdpValue = closestPoint.value;
              }
            }
          }

          return {
            ...c,
            economy: { ...c.economy, gdp_ppp_billions: gdpValue },
            calculatedGrowth: growth
          };
        });

        setCountries(enhanced);
        setLoading(false);
      })
      .catch(() => {
        setCountries([]);
        setLoading(false);
      });
  }, [selectedYear, timeseries]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    router.push(`/?year=${year}`, { scroll: false });
  };

  // Top countries by GDP
  const topByGDP = [...countries]
    .filter(c => c.economy?.gdp_ppp_billions)
    .sort((a, b) => (b.economy?.gdp_ppp_billions || 0) - (a.economy?.gdp_ppp_billions || 0))
    .slice(0, 10);

  // Countries with highest growth
  const topByGrowth = [...countries]
    .sort((a, b) => (b.calculatedGrowth || 0) - (a.calculatedGrowth || 0))
    .slice(0, 10);

  const gdpColumns: Column<CountryData>[] = [
    {
      key: 'rank',
      label: '#',
      sortable: false,
      format: (_, row) => {
        const idx = topByGDP.findIndex(c => c.country === row.country);
        return (
          <span className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium text-slate-400 bg-slate-100">
            {idx + 1}
          </span>
        );
      },
    },
    {
      key: 'country',
      label: 'Country',
      format: (_, row) => (
        <Link
          href={`/countries/${encodeURIComponent(row.country.toLowerCase().replace(/\s+/g, '_'))}`}
          className="font-medium text-slate-800 hover:text-blue-600 transition-colors"
        >
          <div>
            <p>{row.country}</p>
            <p className="text-xs text-slate-400">{row.region}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'demographics.population',
      label: 'Population',
      align: 'right',
      className: 'hidden sm:table-cell',
      format: (val) => <span className="text-slate-600">{formatNumber(val)}</span>,
    },
    {
      key: 'demographics.life_expectancy',
      label: 'Life Exp.',
      align: 'right',
      className: 'hidden md:table-cell',
      format: (val) => <span className="text-slate-600">{val ? `${val.toFixed(1)} yrs` : 'N/A'}</span>,
    },
    {
      key: 'economy.gdp_ppp_billions',
      label: 'GDP (PPP)',
      align: 'right',
      format: (val, row) => (
        <div className="text-right">
          <p className="font-semibold text-slate-800">{formatBillions(val)}</p>
          <p className={`text-xs ${(row.calculatedGrowth || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {(row.calculatedGrowth || 0) > 0 ? '+' : ''}{(row.calculatedGrowth || 0).toFixed(1)}% / yr
          </p>
        </div>
      ),
    },
  ];

  const growthColumns: Column<CountryData>[] = [
    {
      key: 'rank',
      label: '#',
      sortable: false,
      format: (_, row) => {
        const idx = topByGrowth.findIndex(c => c.country === row.country);
        return (
          <span className="w-6 h-6 flex items-center justify-center rounded text-xs font-medium text-slate-400 bg-slate-100">
            {idx + 1}
          </span>
        );
      },
    },
    {
      key: 'country',
      label: 'Country',
      format: (_, row) => (
        <Link
          href={`/countries/${encodeURIComponent(row.country.toLowerCase().replace(/\s+/g, '_'))}`}
          className="font-medium text-slate-800 hover:text-blue-600 transition-colors"
        >
          <div>
            <p>{row.country}</p>
            <p className="text-xs text-slate-400">{row.region}</p>
          </div>
        </Link>
      ),
    },
    {
      key: 'economy.inflation_pct',
      label: 'Inflation',
      align: 'right',
      className: 'hidden sm:table-cell',
      format: (val) => (
        <span className={val && val > 5 ? 'text-amber-600' : 'text-slate-600'}>
          {val ? `${val.toFixed(1)}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'military.expenditure_pct_gdp',
      label: 'Military %',
      align: 'right',
      className: 'hidden md:table-cell',
      format: (val) => (
        <span className={val && val > 3 ? 'text-red-600' : 'text-slate-600'}>
          {val ? `${val.toFixed(1)}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'calculatedGrowth',
      label: 'Growth',
      align: 'right',
      format: (val, row) => (
        <div className="text-right">
          <p className="font-semibold text-emerald-600">+{formatPercent(val)}</p>
          <p className="text-xs text-slate-400">GDP: {formatBillions(row.economy?.gdp_ppp_billions)}</p>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-500">Data Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-400">
            {countries.length} countries loaded
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="xl" text="Loading global data..." />
          </div>
        ) : (
          <>
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Economies */}
              <section className="bg-white/80 rounded-xl p-6 border border-slate-200/80 backdrop-blur-sm shadow-sm">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                  Largest Economies (GDP PPP)
                </h2>
                <SortableTable
                  data={topByGDP}
                  columns={gdpColumns}
                  rowKey="country"
                  initialSortColumn="economy.gdp_ppp_billions"
                  initialSortDirection="desc"
                  className="border-0 shadow-none"
                />
              </section>

              {/* Fastest Growing */}
              <section className="bg-white/80 rounded-xl p-6 border border-slate-200/80 backdrop-blur-sm shadow-sm">
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                  Fastest Growing Economies
                </h2>
                <SortableTable
                  data={topByGrowth}
                  columns={growthColumns}
                  rowKey="country"
                  initialSortColumn="calculatedGrowth"
                  initialSortDirection="desc"
                  className="border-0 shadow-none"
                />
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
          </>
        )}
      </main>
    </div>
  );
}
