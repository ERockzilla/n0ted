import fs from 'fs';
import path from 'path';

export interface CountryData {
    country: string;
    region: string;
    year: number;
    demographics: {
        population?: number;
        population_growth_pct?: number;
        life_expectancy?: number;
        median_age?: number;
        birth_rate?: number;
        death_rate?: number;
        urbanization_pct?: number;
    };
    economy: {
        gdp_ppp_billions?: number;
        gdp_growth_pct?: number;
        gdp_per_capita?: number;
        inflation_pct?: number;
        unemployment_pct?: number;
        poverty_pct?: number;
        exports_billions?: number;
        imports_billions?: number;
        external_debt_billions?: number;
        oil_production_bbl_day?: number;
        oil_consumption_bbl_day?: number;
        current_account_billions?: number;
    };
    military: {
        expenditure_pct_gdp?: number;
        manpower_available?: number;
    };
    political: {
        chief_of_state?: string;
        head_of_government?: string;
        last_election?: string;
    };
}

export interface IndexData {
    year: number;
    total_countries: number;
    countries: Array<{
        name: string;
        region: string;
        file: string;
    }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');

export function getAvailableYears(): number[] {
    try {
        const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory() && /^\d{4}$/.test(e.name))
            .map(e => parseInt(e.name))
            .sort((a, b) => a - b);
    } catch {
        return [];
    }
}

export function loadIndex(year: number): IndexData | null {
    try {
        const indexPath = path.join(DATA_DIR, String(year), '_index.json');
        const content = fs.readFileSync(indexPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

export function loadCountry(year: number, filename: string): CountryData | null {
    try {
        const filePath = path.join(DATA_DIR, String(year), filename);
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

export function loadAllCountries(year: number): CountryData[] {
    const index = loadIndex(year);
    if (!index) return [];

    const countries: CountryData[] = [];
    for (const entry of index.countries) {
        const country = loadCountry(year, entry.file);
        if (country) {
            countries.push(country);
        }
    }
    return countries;
}

export function getRegions(countries: CountryData[]): string[] {
    const regions = new Set(countries.map(c => c.region));
    return Array.from(regions).sort();
}

// Format large numbers for display
export function formatNumber(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toFixed(1);
}

export function formatPercent(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    return `${n.toFixed(1)}%`;
}

export function formatBillions(n: number | undefined): string {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}T`;
    return `$${n.toFixed(1)}B`;
}
