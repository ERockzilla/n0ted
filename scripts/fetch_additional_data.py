"""
World Bank Data Enhancement Script for GeoForecaster
====================================================

Fetches additional metrics from World Bank Open Data API to enhance
correlation analysis capabilities.

Indicators fetched:
- GDP deflator (for currency adjustment)
- Education spending (% of GDP)
- Healthcare spending (% of GDP)  
- Internet users (% of population)
- Urban population (%)

Usage:
    python fetch_additional_data.py

Output:
    data/_enhanced/world_bank_indicators.json

Requirements:
    - requests (pip install requests)

Notes:
    - World Bank API is free and requires no API key
    - Rate limited to ~30 requests/second
    - Historical data from 2000-2020
"""

import json
import time
import os
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing requests...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'requests'])
    import requests

# World Bank API base URL
WB_API_BASE = "https://api.worldbank.org/v2"

# Indicators to fetch
INDICATORS = {
    'NY.GDP.DEFL.ZS': 'gdp_deflator',           # GDP deflator (annual %)
    'SE.XPD.TOTL.GD.ZS': 'education_pct_gdp',   # Education spending (% GDP)
    'SH.XPD.CHEX.GD.ZS': 'health_pct_gdp',      # Health expenditure (% GDP)
    'IT.NET.USER.ZS': 'internet_pct',           # Internet users (% pop)
    'SP.URB.TOTL.IN.ZS': 'urban_pct',           # Urban population (%)
    'SL.TLF.TOTL.IN': 'labor_force',            # Total labor force
    'FP.CPI.TOTL.ZG': 'cpi_inflation',          # Consumer price inflation
    'BX.KLT.DINV.WD.GD.ZS': 'fdi_pct_gdp',     # Foreign direct investment (% GDP)
}

# Country code mapping (CIA Factbook name -> World Bank ISO code)
# This maps the most important countries; add more as needed
COUNTRY_CODES = {
    'afghanistan': 'AFG',
    'albania': 'ALB',
    'algeria': 'DZA',
    'argentina': 'ARG',
    'australia': 'AUS',
    'austria': 'AUT',
    'bangladesh': 'BGD',
    'belgium': 'BEL',
    'brazil': 'BRA',
    'canada': 'CAN',
    'chile': 'CHL',
    'china': 'CHN',
    'colombia': 'COL',
    'czechia': 'CZE',
    'denmark': 'DNK',
    'egypt': 'EGY',
    'ethiopia': 'ETH',
    'finland': 'FIN',
    'france': 'FRA',
    'germany': 'DEU',
    'greece': 'GRC',
    'hungary': 'HUN',
    'india': 'IND',
    'indonesia': 'IDN',
    'iran': 'IRN',
    'iraq': 'IRQ',
    'ireland': 'IRL',
    'israel': 'ISR',
    'italy': 'ITA',
    'japan': 'JPN',
    'kenya': 'KEN',
    'malaysia': 'MYS',
    'mexico': 'MEX',
    'morocco': 'MAR',
    'netherlands': 'NLD',
    'new_zealand': 'NZL',
    'nigeria': 'NGA',
    'norway': 'NOR',
    'pakistan': 'PAK',
    'peru': 'PER',
    'philippines': 'PHL',
    'poland': 'POL',
    'portugal': 'PRT',
    'romania': 'ROU',
    'russia': 'RUS',
    'saudi_arabia': 'SAU',
    'singapore': 'SGP',
    'south_africa': 'ZAF',
    'south_korea': 'KOR',
    'spain': 'ESP',
    'sweden': 'SWE',
    'switzerland': 'CHE',
    'thailand': 'THA',
    'turkey': 'TUR',
    'ukraine': 'UKR',
    'united_arab_emirates': 'ARE',
    'united_kingdom': 'GBR',
    'united_states': 'USA',
    'venezuela': 'VEN',
    'vietnam': 'VNM',
}

def fetch_indicator(indicator_code: str, countries: list[str], start_year: int = 2000, end_year: int = 2020) -> dict:
    """
    Fetch a single indicator for all specified countries.
    
    Returns:
        {country_code: [{year: value}, ...], ...}
    """
    # Join countries into comma-separated list
    country_str = ';'.join(countries)
    
    url = f"{WB_API_BASE}/country/{country_str}/indicator/{indicator_code}"
    params = {
        'format': 'json',
        'date': f'{start_year}:{end_year}',
        'per_page': 10000
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        if len(data) < 2:
            print(f"  No data for {indicator_code}")
            return {}
        
        # Parse results
        results = {}
        for record in data[1] or []:
            country_code = record.get('countryiso3code', record.get('country', {}).get('id', ''))
            year = record.get('date')
            value = record.get('value')
            
            if country_code and year and value is not None:
                if country_code not in results:
                    results[country_code] = []
                results[country_code].append({
                    'year': int(year),
                    'value': float(value)
                })
        
        # Sort by year
        for country in results:
            results[country].sort(key=lambda x: x['year'])
        
        return results
        
    except Exception as e:
        print(f"  Error fetching {indicator_code}: {e}")
        return {}


def main():
    """Main function to fetch all indicators and save to JSON."""
    
    # Determine output path
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    output_dir = project_root / 'data' / '_enhanced'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / 'world_bank_indicators.json'
    
    print("=" * 60)
    print("GeoForecaster World Bank Data Extraction")
    print("=" * 60)
    print(f"Output: {output_file}")
    print(f"Countries: {len(COUNTRY_CODES)}")
    print(f"Indicators: {len(INDICATORS)}")
    print()
    
    # Get list of ISO codes
    iso_codes = list(COUNTRY_CODES.values())
    
    # Fetch all indicators
    all_data = {}
    
    for indicator_code, metric_name in INDICATORS.items():
        print(f"Fetching {metric_name} ({indicator_code})...")
        
        data = fetch_indicator(indicator_code, iso_codes)
        
        # Map back to our country names
        for factbook_name, iso_code in COUNTRY_CODES.items():
            if iso_code in data and len(data[iso_code]) > 0:
                if factbook_name not in all_data:
                    all_data[factbook_name] = {}
                all_data[factbook_name][metric_name] = data[iso_code]
        
        # Rate limiting
        time.sleep(0.5)
    
    # Save to JSON
    print()
    print(f"Saving data for {len(all_data)} countries...")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2)
    
    # Print summary
    print()
    print("=" * 60)
    print("Summary")
    print("=" * 60)
    
    for country, metrics in sorted(all_data.items())[:10]:
        metric_counts = [f"{m}({len(v)})" for m, v in metrics.items()]
        print(f"  {country}: {', '.join(metric_counts[:3])}...")
    
    if len(all_data) > 10:
        print(f"  ... and {len(all_data) - 10} more countries")
    
    print()
    print(f"Data saved to: {output_file}")
    print("Done!")


if __name__ == '__main__':
    main()
