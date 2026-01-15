import { CountryData } from './data';
import { calculateRiskProfile, CountryRiskProfile } from './analysis';

export interface Insight {
    id: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
    title: string;
    description: string;
    icon: string;
    metric?: string;
    value?: string;
}

export function generateCountryInsights(country: CountryData, allCountries: CountryData[]): Insight[] {
    const insights: Insight[] = [];
    const riskProfile = calculateRiskProfile(country, allCountries);
    
    // Regional comparisons
    const regionalCountries = allCountries.filter(c => c.region === country.region);
    const regionalGdps = regionalCountries
        .filter(c => c.economy.gdp_ppp_billions)
        .sort((a, b) => (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0));
    
    const gdpRank = regionalGdps.findIndex(c => c.country === country.country) + 1;
    
    // GDP Regional Rank
    if (gdpRank === 1 && regionalGdps.length > 1) {
        insights.push({
            id: 'gdp-regional-leader',
            type: 'positive',
            title: 'Regional Economic Leader',
            description: `Largest economy in ${country.region} by GDP (PPP)`,
            icon: '🏆',
            metric: 'GDP Rank',
            value: `#1 of ${regionalGdps.length}`
        });
    } else if (gdpRank <= 3 && gdpRank > 0) {
        insights.push({
            id: 'gdp-regional-top',
            type: 'positive',
            title: 'Top Regional Economy',
            description: `Ranks #${gdpRank} in ${country.region} by GDP`,
            icon: '📊',
            metric: 'GDP Rank',
            value: `#${gdpRank} of ${regionalGdps.length}`
        });
    }
    
    // GDP Growth Analysis
    if (country.economy.gdp_growth_pct !== undefined) {
        const growth = country.economy.gdp_growth_pct;
        const regionalGrowths = regionalCountries
            .filter(c => c.economy.gdp_growth_pct !== undefined)
            .map(c => c.economy.gdp_growth_pct!);
        const avgRegionalGrowth = regionalGrowths.reduce((a, b) => a + b, 0) / regionalGrowths.length;
        
        if (growth > avgRegionalGrowth * 1.5 && growth > 5) {
            insights.push({
                id: 'high-growth',
                type: 'positive',
                title: 'Rapid Economic Growth',
                description: `GDP growth of ${growth.toFixed(1)}% significantly exceeds regional average of ${avgRegionalGrowth.toFixed(1)}%`,
                icon: '🚀',
                metric: 'Growth Rate',
                value: `+${growth.toFixed(1)}%`
            });
        } else if (growth < 0) {
            insights.push({
                id: 'negative-growth',
                type: 'warning',
                title: 'Economic Contraction',
                description: `Economy is contracting at ${Math.abs(growth).toFixed(1)}% annually`,
                icon: '📉',
                metric: 'Growth Rate',
                value: `${growth.toFixed(1)}%`
            });
        }
    }
    
    // Military Spending Analysis
    if (country.military.expenditure_pct_gdp !== undefined) {
        const military = country.military.expenditure_pct_gdp;
        const regionalMilitary = regionalCountries
            .filter(c => c.military.expenditure_pct_gdp !== undefined)
            .map(c => c.military.expenditure_pct_gdp!);
        const avgRegionalMilitary = regionalMilitary.reduce((a, b) => a + b, 0) / regionalMilitary.length;
        
        if (military > avgRegionalMilitary * 2) {
            insights.push({
                id: 'high-military',
                type: 'warning',
                title: 'Elevated Military Spending',
                description: `Military expenditure is ${(military / avgRegionalMilitary).toFixed(1)}x the regional average`,
                icon: '⚔️',
                metric: 'Military % GDP',
                value: `${military.toFixed(1)}%`
            });
        } else if (military < 1 && avgRegionalMilitary > 2) {
            insights.push({
                id: 'low-military',
                type: 'neutral',
                title: 'Minimal Military Investment',
                description: `Military spending well below regional norms, possible reliance on alliances`,
                icon: '🕊️',
                metric: 'Military % GDP',
                value: `${military.toFixed(1)}%`
            });
        }
    }
    
    // Trade Analysis
    if (country.economy.exports_billions && country.economy.imports_billions) {
        const balance = country.economy.exports_billions - country.economy.imports_billions;
        const exports = country.economy.exports_billions;
        
        if (balance > 50) {
            insights.push({
                id: 'trade-surplus',
                type: 'positive',
                title: 'Strong Trade Surplus',
                description: `Exports exceed imports by $${balance.toFixed(0)}B annually`,
                icon: '📦',
                metric: 'Trade Balance',
                value: `+$${balance.toFixed(0)}B`
            });
        } else if (balance < -100) {
            insights.push({
                id: 'trade-deficit',
                type: 'warning',
                title: 'Significant Trade Deficit',
                description: `Importing $${Math.abs(balance).toFixed(0)}B more than exporting`,
                icon: '⚠️',
                metric: 'Trade Balance',
                value: `-$${Math.abs(balance).toFixed(0)}B`
            });
        }
        
        // Check if major exporter
        const allExports = allCountries
            .filter(c => c.economy.exports_billions)
            .sort((a, b) => (b.economy.exports_billions || 0) - (a.economy.exports_billions || 0));
        const exportRank = allExports.findIndex(c => c.country === country.country) + 1;
        
        if (exportRank <= 10) {
            insights.push({
                id: 'major-exporter',
                type: 'positive',
                title: 'Global Export Power',
                description: `Ranks #${exportRank} globally in exports`,
                icon: '🌐',
                metric: 'Exports',
                value: `$${exports.toFixed(0)}B`
            });
        }
    }
    
    // Demographic Insights
    if (country.demographics.median_age !== undefined) {
        const age = country.demographics.median_age;
        if (age > 45) {
            insights.push({
                id: 'aging-population',
                type: 'warning',
                title: 'Aging Population',
                description: `High median age of ${age.toFixed(1)} years indicates demographic challenges`,
                icon: '👴',
                metric: 'Median Age',
                value: `${age.toFixed(1)} years`
            });
        } else if (age < 20) {
            insights.push({
                id: 'young-population',
                type: 'neutral',
                title: 'Very Young Population',
                description: `Median age of ${age.toFixed(1)} years suggests high youth dependency`,
                icon: '👶',
                metric: 'Median Age',
                value: `${age.toFixed(1)} years`
            });
        }
    }
    
    if (country.demographics.population_growth_pct !== undefined) {
        const growth = country.demographics.population_growth_pct;
        if (growth < -0.5) {
            insights.push({
                id: 'population-decline',
                type: 'warning',
                title: 'Population Decline',
                description: `Population shrinking at ${Math.abs(growth).toFixed(2)}% annually`,
                icon: '📉',
                metric: 'Pop. Growth',
                value: `${growth.toFixed(2)}%`
            });
        }
    }
    
    // Risk Score Insight
    const score = riskProfile.score;
    if (score.overall >= 75) {
        insights.push({
            id: 'stability-high',
            type: 'positive',
            title: 'High Stability Score',
            description: 'Strong performance across economic, political, and demographic indicators',
            icon: '✅',
            metric: 'Stability Index',
            value: `${score.overall}/100`
        });
    } else if (score.overall < 40) {
        insights.push({
            id: 'stability-low',
            type: 'warning',
            title: 'Elevated Risk Profile',
            description: 'Multiple indicators suggest heightened instability risks',
            icon: '⚠️',
            metric: 'Stability Index',
            value: `${score.overall}/100`
        });
    }
    
    // Per Capita Analysis
    if (country.economy.gdp_per_capita !== undefined) {
        const perCapita = country.economy.gdp_per_capita;
        if (perCapita > 50000) {
            insights.push({
                id: 'high-income',
                type: 'positive',
                title: 'High-Income Economy',
                description: `GDP per capita of $${perCapita.toLocaleString()} indicates advanced economy`,
                icon: '💎',
                metric: 'GDP/Capita',
                value: `$${perCapita.toLocaleString()}`
            });
        } else if (perCapita < 2000) {
            insights.push({
                id: 'low-income',
                type: 'neutral',
                title: 'Developing Economy',
                description: `GDP per capita of $${perCapita.toLocaleString()} suggests development challenges`,
                icon: '🌱',
                metric: 'GDP/Capita',
                value: `$${perCapita.toLocaleString()}`
            });
        }
    }
    
    return insights.slice(0, 6); // Return top 6 most relevant insights
}

export function generateRegionalInsights(region: string, countries: CountryData[]): Insight[] {
    const insights: Insight[] = [];
    const regionalCountries = countries.filter(c => c.region === region);
    
    if (regionalCountries.length === 0) return insights;
    
    // Calculate regional aggregates
    const totalPop = regionalCountries.reduce((sum, c) => sum + (c.demographics.population || 0), 0);
    const totalGdp = regionalCountries.reduce((sum, c) => sum + (c.economy.gdp_ppp_billions || 0), 0);
    
    const growthRates = regionalCountries
        .filter(c => c.economy.gdp_growth_pct !== undefined)
        .map(c => c.economy.gdp_growth_pct!);
    const avgGrowth = growthRates.length > 0 ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length : 0;
    
    // Find dominant economy
    const topEconomy = [...regionalCountries]
        .sort((a, b) => (b.economy.gdp_ppp_billions || 0) - (a.economy.gdp_ppp_billions || 0))[0];
    
    if (topEconomy && topEconomy.economy.gdp_ppp_billions) {
        const dominance = (topEconomy.economy.gdp_ppp_billions / totalGdp) * 100;
        if (dominance > 50) {
            insights.push({
                id: 'dominant-economy',
                type: 'neutral',
                title: 'Concentrated Economic Power',
                description: `${topEconomy.country} accounts for ${dominance.toFixed(0)}% of regional GDP`,
                icon: '🏛️',
                metric: 'Share of GDP',
                value: `${dominance.toFixed(0)}%`
            });
        }
    }
    
    // Regional growth outlook
    if (avgGrowth > 5) {
        insights.push({
            id: 'high-regional-growth',
            type: 'positive',
            title: 'Dynamic Growth Region',
            description: `Average GDP growth of ${avgGrowth.toFixed(1)}% indicates economic dynamism`,
            icon: '📈',
            metric: 'Avg Growth',
            value: `+${avgGrowth.toFixed(1)}%`
        });
    } else if (avgGrowth < 1) {
        insights.push({
            id: 'low-regional-growth',
            type: 'warning',
            title: 'Sluggish Regional Growth',
            description: `Average GDP growth of ${avgGrowth.toFixed(1)}% suggests economic challenges`,
            icon: '📊',
            metric: 'Avg Growth',
            value: `+${avgGrowth.toFixed(1)}%`
        });
    }
    
    // Population insights
    const globalPop = countries.reduce((sum, c) => sum + (c.demographics.population || 0), 0);
    const popShare = (totalPop / globalPop) * 100;
    
    insights.push({
        id: 'population-share',
        type: 'neutral',
        title: 'Population Demographics',
        description: `${regionalCountries.length} countries with ${popShare.toFixed(1)}% of world population`,
        icon: '👥',
        metric: 'World Share',
        value: `${popShare.toFixed(1)}%`
    });
    
    return insights;
}
