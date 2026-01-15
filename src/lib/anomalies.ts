import { CountryData } from './data';

export interface Anomaly {
    id: string;
    type: 'militarization' | 'economic_collapse' | 'demographic_cliff' | 'trade_imbalance' | 'debt_crisis' | 'hyperinflation';
    severity: 'low' | 'medium' | 'high' | 'critical';
    country: string;
    region: string;
    title: string;
    description: string;
    metric: string;
    value: string;
    threshold: string;
    icon: string;
}

interface AnomalyConfig {
    type: Anomaly['type'];
    title: string;
    icon: string;
    check: (country: CountryData, stats: RegionalStats) => Anomaly | null;
}

interface RegionalStats {
    avgMilitary: number;
    stdMilitary: number;
    avgGrowth: number;
    avgInflation: number;
    avgDebt: number;
}

function getStats(values: number[]): { mean: number; stdDev: number } {
    const n = values.length;
    if (n === 0) return { mean: 0, stdDev: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    return { mean, stdDev: Math.sqrt(variance) };
}

function getSeverityColor(severity: Anomaly['severity']): string {
    switch (severity) {
        case 'critical': return '#dc2626';
        case 'high': return '#f97316';
        case 'medium': return '#eab308';
        case 'low': return '#84cc16';
    }
}

const ANOMALY_CHECKS: AnomalyConfig[] = [
    {
        type: 'militarization',
        title: 'Rapid Militarization',
        icon: '⚔️',
        check: (country, stats) => {
            const military = country.military.expenditure_pct_gdp;
            if (military === undefined) return null;
            
            const zScore = stats.stdMilitary > 0 ? (military - stats.avgMilitary) / stats.stdMilitary : 0;
            
            if (zScore > 2 && military > 5) {
                return {
                    id: `militarization-${country.country}`,
                    type: 'militarization',
                    severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
                    country: country.country,
                    region: country.region,
                    title: 'Rapid Militarization Alert',
                    description: `Military spending significantly exceeds regional norms, indicating potential security concerns or regional tensions.`,
                    metric: 'Military % GDP',
                    value: `${military.toFixed(1)}%`,
                    threshold: `Regional avg: ${stats.avgMilitary.toFixed(1)}%`,
                    icon: '⚔️'
                };
            }
            return null;
        }
    },
    {
        type: 'economic_collapse',
        title: 'Economic Collapse Warning',
        icon: '📉',
        check: (country, stats) => {
            const growth = country.economy.gdp_growth_pct;
            const inflation = country.economy.inflation_pct;
            const unemployment = country.economy.unemployment_pct;
            
            if (growth === undefined) return null;
            
            // Check for severe contraction
            if (growth < -5) {
                let severity: Anomaly['severity'] = 'medium';
                if (growth < -10) severity = 'critical';
                else if (growth < -7) severity = 'high';
                
                // Worse if combined with high inflation or unemployment
                if ((inflation && inflation > 20) || (unemployment && unemployment > 20)) {
                    severity = 'critical';
                }
                
                return {
                    id: `economic-collapse-${country.country}`,
                    type: 'economic_collapse',
                    severity,
                    country: country.country,
                    region: country.region,
                    title: 'Economic Collapse Warning',
                    description: `Severe economic contraction detected${inflation && inflation > 10 ? ' combined with high inflation' : ''}.`,
                    metric: 'GDP Growth',
                    value: `${growth.toFixed(1)}%`,
                    threshold: 'Alert threshold: < -5%',
                    icon: '📉'
                };
            }
            return null;
        }
    },
    {
        type: 'demographic_cliff',
        title: 'Demographic Cliff',
        icon: '👴',
        check: (country) => {
            const popGrowth = country.demographics.population_growth_pct;
            const medianAge = country.demographics.median_age;
            
            // Severe: negative population growth + high median age
            if (popGrowth !== undefined && popGrowth < -0.5 && medianAge !== undefined && medianAge > 40) {
                return {
                    id: `demographic-cliff-${country.country}`,
                    type: 'demographic_cliff',
                    severity: popGrowth < -1 ? 'high' : 'medium',
                    country: country.country,
                    region: country.region,
                    title: 'Demographic Cliff Warning',
                    description: `Population declining with aging demographics, signaling long-term workforce and social security challenges.`,
                    metric: 'Population Growth',
                    value: `${popGrowth.toFixed(2)}%`,
                    threshold: `Median age: ${medianAge.toFixed(1)} years`,
                    icon: '👴'
                };
            }
            return null;
        }
    },
    {
        type: 'trade_imbalance',
        title: 'Trade Imbalance',
        icon: '⚖️',
        check: (country) => {
            const exports = country.economy.exports_billions;
            const imports = country.economy.imports_billions;
            const gdp = country.economy.gdp_ppp_billions;
            
            if (!exports || !imports || !gdp) return null;
            
            const deficit = imports - exports;
            const deficitRatio = deficit / gdp;
            
            // Significant deficit relative to GDP
            if (deficitRatio > 0.15 && deficit > 50) {
                return {
                    id: `trade-imbalance-${country.country}`,
                    type: 'trade_imbalance',
                    severity: deficitRatio > 0.25 ? 'high' : 'medium',
                    country: country.country,
                    region: country.region,
                    title: 'Severe Trade Imbalance',
                    description: `Large persistent trade deficit may indicate structural economic vulnerabilities.`,
                    metric: 'Trade Deficit',
                    value: `-$${deficit.toFixed(0)}B`,
                    threshold: `${(deficitRatio * 100).toFixed(0)}% of GDP`,
                    icon: '⚖️'
                };
            }
            return null;
        }
    },
    {
        type: 'debt_crisis',
        title: 'Debt Crisis',
        icon: '💳',
        check: (country) => {
            const debt = country.economy.external_debt_billions;
            const gdp = country.economy.gdp_ppp_billions;
            
            if (!debt || !gdp) return null;
            
            const debtRatio = debt / gdp;
            
            if (debtRatio > 1.5) {
                return {
                    id: `debt-crisis-${country.country}`,
                    type: 'debt_crisis',
                    severity: debtRatio > 3 ? 'critical' : debtRatio > 2 ? 'high' : 'medium',
                    country: country.country,
                    region: country.region,
                    title: 'Elevated Debt Levels',
                    description: `External debt significantly exceeds GDP, indicating potential solvency risks.`,
                    metric: 'Debt/GDP Ratio',
                    value: `${(debtRatio * 100).toFixed(0)}%`,
                    threshold: 'Alert threshold: > 150%',
                    icon: '💳'
                };
            }
            return null;
        }
    },
    {
        type: 'hyperinflation',
        title: 'Hyperinflation',
        icon: '🔥',
        check: (country) => {
            const inflation = country.economy.inflation_pct;
            
            if (inflation === undefined) return null;
            
            if (inflation > 25) {
                return {
                    id: `hyperinflation-${country.country}`,
                    type: 'hyperinflation',
                    severity: inflation > 100 ? 'critical' : inflation > 50 ? 'high' : 'medium',
                    country: country.country,
                    region: country.region,
                    title: 'Hyperinflation Alert',
                    description: `Extremely high inflation eroding purchasing power and economic stability.`,
                    metric: 'Inflation Rate',
                    value: `${inflation.toFixed(1)}%`,
                    threshold: 'Alert threshold: > 25%',
                    icon: '🔥'
                };
            }
            return null;
        }
    }
];

function calculateRegionalStats(countries: CountryData[], region: string): RegionalStats {
    const regionalCountries = countries.filter(c => c.region === region);
    
    const militaryValues = regionalCountries
        .filter(c => c.military.expenditure_pct_gdp !== undefined)
        .map(c => c.military.expenditure_pct_gdp!);
    
    const growthValues = regionalCountries
        .filter(c => c.economy.gdp_growth_pct !== undefined)
        .map(c => c.economy.gdp_growth_pct!);
    
    const inflationValues = regionalCountries
        .filter(c => c.economy.inflation_pct !== undefined)
        .map(c => c.economy.inflation_pct!);
    
    const debtValues = regionalCountries
        .filter(c => c.economy.external_debt_billions !== undefined)
        .map(c => c.economy.external_debt_billions!);
    
    const militaryStats = getStats(militaryValues);
    
    return {
        avgMilitary: militaryStats.mean,
        stdMilitary: militaryStats.stdDev,
        avgGrowth: growthValues.length > 0 ? growthValues.reduce((a, b) => a + b, 0) / growthValues.length : 0,
        avgInflation: inflationValues.length > 0 ? inflationValues.reduce((a, b) => a + b, 0) / inflationValues.length : 0,
        avgDebt: debtValues.length > 0 ? debtValues.reduce((a, b) => a + b, 0) / debtValues.length : 0
    };
}

export function detectAnomalies(countries: CountryData[]): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // Pre-calculate regional stats
    const regions = [...new Set(countries.map(c => c.region))];
    const regionalStatsMap = new Map<string, RegionalStats>();
    
    regions.forEach(region => {
        regionalStatsMap.set(region, calculateRegionalStats(countries, region));
    });
    
    // Check each country for anomalies
    countries.forEach(country => {
        const stats = regionalStatsMap.get(country.region)!;
        
        ANOMALY_CHECKS.forEach(check => {
            const anomaly = check.check(country, stats);
            if (anomaly) {
                anomalies.push(anomaly);
            }
        });
    });
    
    // Sort by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    return anomalies;
}

export function getAnomaliesByType(anomalies: Anomaly[]): Record<Anomaly['type'], Anomaly[]> {
    const grouped: Record<Anomaly['type'], Anomaly[]> = {
        militarization: [],
        economic_collapse: [],
        demographic_cliff: [],
        trade_imbalance: [],
        debt_crisis: [],
        hyperinflation: []
    };
    
    anomalies.forEach(a => {
        grouped[a.type].push(a);
    });
    
    return grouped;
}

export function getAnomaliesBySeverity(anomalies: Anomaly[]): Record<Anomaly['severity'], Anomaly[]> {
    const grouped: Record<Anomaly['severity'], Anomaly[]> = {
        critical: [],
        high: [],
        medium: [],
        low: []
    };
    
    anomalies.forEach(a => {
        grouped[a.severity].push(a);
    });
    
    return grouped;
}

export function getAnomalyStats(anomalies: Anomaly[]): {
    total: number;
    bySeverity: Record<Anomaly['severity'], number>;
    byType: Record<Anomaly['type'], number>;
    affectedCountries: number;
    affectedRegions: number;
} {
    const countries = new Set(anomalies.map(a => a.country));
    const regions = new Set(anomalies.map(a => a.region));
    
    return {
        total: anomalies.length,
        bySeverity: {
            critical: anomalies.filter(a => a.severity === 'critical').length,
            high: anomalies.filter(a => a.severity === 'high').length,
            medium: anomalies.filter(a => a.severity === 'medium').length,
            low: anomalies.filter(a => a.severity === 'low').length
        },
        byType: {
            militarization: anomalies.filter(a => a.type === 'militarization').length,
            economic_collapse: anomalies.filter(a => a.type === 'economic_collapse').length,
            demographic_cliff: anomalies.filter(a => a.type === 'demographic_cliff').length,
            trade_imbalance: anomalies.filter(a => a.type === 'trade_imbalance').length,
            debt_crisis: anomalies.filter(a => a.type === 'debt_crisis').length,
            hyperinflation: anomalies.filter(a => a.type === 'hyperinflation').length
        },
        affectedCountries: countries.size,
        affectedRegions: regions.size
    };
}
