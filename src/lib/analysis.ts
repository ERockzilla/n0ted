import { CountryData } from './data';

export interface RiskScore {
    overall: number;
    economic: number;
    political: number;
    military: number;
    demographic: number;
    label: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
    color: string;
}

export interface CountryRiskProfile {
    country: string;
    region: string;
    score: RiskScore;
    factors: RiskFactor[];
    rank?: number;
    regionalRank?: number;
}

export interface RiskFactor {
    name: string;
    value: number | string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
}

export interface RegionalStats {
    region: string;
    avgGdp: number;
    avgGrowth: number;
    avgMilitary: number;
    totalPopulation: number;
    countryCount: number;
    topEconomy: string;
    avgRiskScore: number;
}

// Calculate z-score for a value against a dataset
function zScore(value: number, mean: number, stdDev: number): number {
    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
}

// Calculate mean and standard deviation
function getStats(values: number[]): { mean: number; stdDev: number } {
    const n = values.length;
    if (n === 0) return { mean: 0, stdDev: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    return { mean, stdDev: Math.sqrt(variance) };
}

// Normalize score to 0-100 scale
function normalizeScore(z: number): number {
    // Convert z-score to percentile-like score (0-100)
    // Using a sigmoid-like transformation
    const score = 50 + (z * 15);
    return Math.max(0, Math.min(100, score));
}

// Calculate economic stability score
function calculateEconomicScore(country: CountryData, globalStats: GlobalStats): number {
    const factors: number[] = [];
    
    // GDP Growth (higher is better, capped)
    if (country.economy.gdp_growth_pct !== undefined) {
        const growthZ = zScore(country.economy.gdp_growth_pct, globalStats.avgGrowth, globalStats.stdGrowth);
        factors.push(normalizeScore(growthZ));
    }
    
    // Inflation (moderate is best, extreme is bad)
    if (country.economy.inflation_pct !== undefined) {
        // Optimal inflation around 2-3%
        const inflationDeviation = Math.abs(country.economy.inflation_pct - 2.5);
        const inflationScore = Math.max(0, 100 - inflationDeviation * 5);
        factors.push(inflationScore);
    }
    
    // Unemployment (lower is better)
    if (country.economy.unemployment_pct !== undefined) {
        const unemploymentScore = Math.max(0, 100 - country.economy.unemployment_pct * 4);
        factors.push(unemploymentScore);
    }
    
    // Trade balance ratio
    if (country.economy.exports_billions && country.economy.imports_billions) {
        const tradeRatio = country.economy.exports_billions / country.economy.imports_billions;
        const tradeScore = Math.min(100, tradeRatio * 50);
        factors.push(tradeScore);
    }
    
    return factors.length > 0 ? factors.reduce((a, b) => a + b, 0) / factors.length : 50;
}

// Calculate political risk score (higher = more stable)
function calculatePoliticalScore(country: CountryData): number {
    let score = 50; // Base score
    
    // Having leadership information suggests more transparent governance
    if (country.political.chief_of_state) {
        score += 10;
    }
    
    if (country.political.head_of_government) {
        score += 5;
    }
    
    if (country.political.last_election) {
        score += 10;
        // Recent elections suggest active democracy
        const electionYear = parseInt(country.political.last_election.match(/\d{4}/)?.[0] || '0');
        if (electionYear && country.year - electionYear <= 4) {
            score += 10;
        }
    }
    
    return Math.min(100, score);
}

// Calculate military tension score (higher = more stable/peaceful)
function calculateMilitaryScore(country: CountryData, globalStats: GlobalStats): number {
    if (country.military.expenditure_pct_gdp === undefined) {
        return 50; // Unknown
    }
    
    const militaryPct = country.military.expenditure_pct_gdp;
    
    // Very high military spending (>5%) indicates potential tension
    // Very low (<0.5%) might indicate vulnerability
    // Moderate (1-3%) is considered stable
    
    if (militaryPct < 0.5) {
        return 60; // Slight vulnerability but generally peaceful
    } else if (militaryPct <= 3) {
        return 80; // Healthy defense posture
    } else if (militaryPct <= 5) {
        return 50; // Elevated concern
    } else if (militaryPct <= 10) {
        return 30; // High tension
    } else {
        return 15; // Very high tension
    }
}

// Calculate demographic pressure score (higher = less pressure)
function calculateDemographicScore(country: CountryData): number {
    const factors: number[] = [];
    
    // Population growth (moderate is best)
    if (country.demographics.population_growth_pct !== undefined) {
        const growth = country.demographics.population_growth_pct;
        // Optimal: 0.5-2%, negative or very high is problematic
        if (growth < 0) {
            factors.push(Math.max(20, 50 + growth * 20));
        } else if (growth <= 2) {
            factors.push(80);
        } else if (growth <= 3) {
            factors.push(60);
        } else {
            factors.push(Math.max(20, 80 - growth * 10));
        }
    }
    
    // Median age (too young or too old is challenging)
    if (country.demographics.median_age !== undefined) {
        const age = country.demographics.median_age;
        // Optimal: 28-38
        if (age < 20) {
            factors.push(40); // Very young population - high dependency
        } else if (age < 28) {
            factors.push(70);
        } else if (age <= 38) {
            factors.push(90); // Prime working age
        } else if (age <= 45) {
            factors.push(70); // Aging
        } else {
            factors.push(50); // Significantly aged
        }
    }
    
    // Life expectancy (higher is better)
    if (country.demographics.life_expectancy !== undefined) {
        const le = country.demographics.life_expectancy;
        factors.push(Math.min(100, le * 1.2));
    }
    
    return factors.length > 0 ? factors.reduce((a, b) => a + b, 0) / factors.length : 50;
}

interface GlobalStats {
    avgGdp: number;
    stdGdp: number;
    avgGrowth: number;
    stdGrowth: number;
    avgMilitary: number;
    stdMilitary: number;
}

function calculateGlobalStats(countries: CountryData[]): GlobalStats {
    const gdpValues = countries.filter(c => c.economy.gdp_ppp_billions).map(c => c.economy.gdp_ppp_billions!);
    const growthValues = countries.filter(c => c.economy.gdp_growth_pct).map(c => c.economy.gdp_growth_pct!);
    const militaryValues = countries.filter(c => c.military.expenditure_pct_gdp).map(c => c.military.expenditure_pct_gdp!);
    
    const gdpStats = getStats(gdpValues);
    const growthStats = getStats(growthValues);
    const militaryStats = getStats(militaryValues);
    
    return {
        avgGdp: gdpStats.mean,
        stdGdp: gdpStats.stdDev,
        avgGrowth: growthStats.mean,
        stdGrowth: growthStats.stdDev,
        avgMilitary: militaryStats.mean,
        stdMilitary: militaryStats.stdDev
    };
}

function getRiskLabel(score: number): RiskScore['label'] {
    if (score >= 80) return 'Very Low';
    if (score >= 65) return 'Low';
    if (score >= 45) return 'Moderate';
    if (score >= 30) return 'High';
    return 'Very High';
}

function getRiskColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 65) return '#84cc16';
    if (score >= 45) return '#eab308';
    if (score >= 30) return '#f97316';
    return '#ef4444';
}

export function calculateRiskProfile(country: CountryData, allCountries: CountryData[]): CountryRiskProfile {
    const globalStats = calculateGlobalStats(allCountries);
    
    const economic = calculateEconomicScore(country, globalStats);
    const political = calculatePoliticalScore(country);
    const military = calculateMilitaryScore(country, globalStats);
    const demographic = calculateDemographicScore(country);
    
    // Weighted average
    const overall = (
        economic * 0.30 +
        political * 0.25 +
        military * 0.25 +
        demographic * 0.20
    );
    
    const factors: RiskFactor[] = [];
    
    // Economic factors
    if (country.economy.gdp_growth_pct !== undefined) {
        factors.push({
            name: 'GDP Growth',
            value: `${country.economy.gdp_growth_pct.toFixed(1)}%`,
            impact: country.economy.gdp_growth_pct > 3 ? 'positive' : country.economy.gdp_growth_pct < 0 ? 'negative' : 'neutral',
            weight: 0.10,
            description: country.economy.gdp_growth_pct > 5 ? 'Strong economic expansion' : 
                        country.economy.gdp_growth_pct > 0 ? 'Moderate growth' : 'Economic contraction'
        });
    }
    
    if (country.economy.unemployment_pct !== undefined) {
        factors.push({
            name: 'Unemployment',
            value: `${country.economy.unemployment_pct.toFixed(1)}%`,
            impact: country.economy.unemployment_pct < 5 ? 'positive' : country.economy.unemployment_pct > 10 ? 'negative' : 'neutral',
            weight: 0.08,
            description: country.economy.unemployment_pct < 5 ? 'Near full employment' :
                        country.economy.unemployment_pct < 10 ? 'Moderate unemployment' : 'High unemployment'
        });
    }
    
    if (country.military.expenditure_pct_gdp !== undefined) {
        factors.push({
            name: 'Military Spending',
            value: `${country.military.expenditure_pct_gdp.toFixed(1)}% GDP`,
            impact: country.military.expenditure_pct_gdp > 5 ? 'negative' : 
                   country.military.expenditure_pct_gdp < 1 ? 'neutral' : 'positive',
            weight: 0.12,
            description: country.military.expenditure_pct_gdp > 5 ? 'Elevated military posture' :
                        country.military.expenditure_pct_gdp > 2 ? 'Standard defense spending' : 'Low military investment'
        });
    }
    
    if (country.demographics.population_growth_pct !== undefined) {
        factors.push({
            name: 'Population Growth',
            value: `${country.demographics.population_growth_pct.toFixed(2)}%`,
            impact: country.demographics.population_growth_pct < 0 ? 'negative' :
                   country.demographics.population_growth_pct > 3 ? 'negative' : 'positive',
            weight: 0.08,
            description: country.demographics.population_growth_pct < 0 ? 'Declining population' :
                        country.demographics.population_growth_pct > 3 ? 'Rapid population growth' : 'Stable population dynamics'
        });
    }
    
    return {
        country: country.country,
        region: country.region,
        score: {
            overall: Math.round(overall),
            economic: Math.round(economic),
            political: Math.round(political),
            military: Math.round(military),
            demographic: Math.round(demographic),
            label: getRiskLabel(overall),
            color: getRiskColor(overall)
        },
        factors
    };
}

export function calculateAllRiskProfiles(countries: CountryData[]): CountryRiskProfile[] {
    const profiles = countries.map(c => calculateRiskProfile(c, countries));
    
    // Sort by overall score descending (higher = more stable)
    profiles.sort((a, b) => b.score.overall - a.score.overall);
    
    // Assign global ranks
    profiles.forEach((p, i) => {
        p.rank = i + 1;
    });
    
    // Assign regional ranks
    const regionGroups = new Map<string, CountryRiskProfile[]>();
    profiles.forEach(p => {
        const group = regionGroups.get(p.region) || [];
        group.push(p);
        regionGroups.set(p.region, group);
    });
    
    regionGroups.forEach(group => {
        group.forEach((p, i) => {
            p.regionalRank = i + 1;
        });
    });
    
    return profiles;
}

export function calculateRegionalStats(countries: CountryData[]): RegionalStats[] {
    const regionMap = new Map<string, CountryData[]>();
    
    countries.forEach(c => {
        const group = regionMap.get(c.region) || [];
        group.push(c);
        regionMap.set(c.region, group);
    });
    
    const stats: RegionalStats[] = [];
    const allProfiles = calculateAllRiskProfiles(countries);
    
    regionMap.forEach((regionCountries, region) => {
        const gdpValues = regionCountries.filter(c => c.economy.gdp_ppp_billions).map(c => c.economy.gdp_ppp_billions!);
        const growthValues = regionCountries.filter(c => c.economy.gdp_growth_pct).map(c => c.economy.gdp_growth_pct!);
        const militaryValues = regionCountries.filter(c => c.military.expenditure_pct_gdp).map(c => c.military.expenditure_pct_gdp!);
        const populations = regionCountries.filter(c => c.demographics.population).map(c => c.demographics.population!);
        
        const topByGdp = regionCountries
            .filter(c => c.economy.gdp_ppp_billions)
            .sort((a, b) => (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0))[0];
        
        const regionalProfiles = allProfiles.filter(p => p.region === region);
        const avgRisk = regionalProfiles.reduce((sum, p) => sum + p.score.overall, 0) / regionalProfiles.length;
        
        stats.push({
            region,
            avgGdp: gdpValues.length > 0 ? gdpValues.reduce((a, b) => a + b, 0) / gdpValues.length : 0,
            avgGrowth: growthValues.length > 0 ? growthValues.reduce((a, b) => a + b, 0) / growthValues.length : 0,
            avgMilitary: militaryValues.length > 0 ? militaryValues.reduce((a, b) => a + b, 0) / militaryValues.length : 0,
            totalPopulation: populations.reduce((a, b) => a + b, 0),
            countryCount: regionCountries.length,
            topEconomy: topByGdp?.country || 'N/A',
            avgRiskScore: Math.round(avgRisk)
        });
    });
    
    return stats.sort((a, b) => b.avgRiskScore - a.avgRiskScore);
}
