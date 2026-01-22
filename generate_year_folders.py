#!/usr/bin/env python3
"""
Generate Year Data Folders from Timeseries
==========================================

Creates individual year folders (data/{year}/) with country JSON files and _index.json
by synthesizing data from the existing timeseries.json file.

This enables the dashboard to display historical data for years beyond 2010 and 2020.

Usage:
    python generate_year_folders.py                    # Generate all years from timeseries
    python generate_year_folders.py --years 2015 2018  # Generate specific years

Author: GeoForecaster Team
"""

import json
import os
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Optional, Any

# Configuration
BASE_DIR = Path(__file__).parent.absolute()
DATA_DIR = BASE_DIR / "data"
TIMESERIES_FILE = DATA_DIR / "_merged" / "timeseries.json"

# Use 2010 as template for region mappings (has proper region data)
TEMPLATE_YEAR = 2010

def load_timeseries() -> Dict[str, Dict[str, List[Dict]]]:
    """Load timeseries data."""
    if not TIMESERIES_FILE.exists():
        print(f"ERROR: Timeseries file not found: {TIMESERIES_FILE}")
        sys.exit(1)
    
    with open(TIMESERIES_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_template_index(year: int = TEMPLATE_YEAR) -> Dict:
    """Load template _index.json for region mappings."""
    index_file = DATA_DIR / str(year) / "_index.json"
    if index_file.exists():
        with open(index_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"countries": []}

def get_available_timeseries_years(timeseries: Dict) -> List[int]:
    """Extract all years available in timeseries data."""
    years = set()
    for country_data in timeseries.values():
        for metric_data in country_data.values():
            if isinstance(metric_data, list):
                for point in metric_data:
                    if isinstance(point, dict) and 'year' in point:
                        years.add(point['year'])
    return sorted(years)

def get_value_for_year(metric_data: List[Dict], year: int) -> Optional[Any]:
    """Get value for specific year from metric data."""
    if not isinstance(metric_data, list):
        return None
    for point in metric_data:
        if isinstance(point, dict) and point.get('year') == year:
            return point.get('value')
    return None

def country_key_to_name(key: str) -> str:
    """Convert country key to display name."""
    # Basic conversion: united_states -> United States
    name = key.replace('_', ' ').title()
    
    # Special cases
    special_cases = {
        'United States': 'United States',
        'United Kingdom': 'United Kingdom',
        'Uae': 'United Arab Emirates',
        'Uk': 'United Kingdom',
        'Usa': 'United States',
        'Drc': 'Democratic Republic of the Congo',
    }
    return special_cases.get(name, name)

def generate_year_folder(year: int, timeseries: Dict, template_index: Dict, overwrite: bool = False) -> int:
    """Generate a year folder with country files and index."""
    year_dir = DATA_DIR / str(year)
    
    # Check if already exists
    if year_dir.exists() and not overwrite:
        print(f"  Skipping {year} - folder already exists (use --overwrite to replace)")
        return 0
    
    # Create directory
    year_dir.mkdir(parents=True, exist_ok=True)
    
    # Build region mapping from template
    region_map = {}
    for entry in template_index.get('countries', []):
        file_name = entry.get('file', '').replace('.json', '')
        region_map[file_name] = entry.get('region', 'Unknown')
    
    # Collect countries with data for this year
    index_entries = []
    countries_written = 0
    
    for country_key, metrics in timeseries.items():
        # Check if country has any data for this year
        country_data = {
            'demographics': {},
            'economy': {},
            'military': {},
            'political': {}
        }
        
        has_data = False
        
        # Map metrics to categories
        metric_categories = {
            'population': ('demographics', 'population'),
            'population_growth_pct': ('demographics', 'population_growth_pct'),
            'life_expectancy': ('demographics', 'life_expectancy'),
            'median_age': ('demographics', 'median_age'),
            'birth_rate': ('demographics', 'birth_rate'),
            'death_rate': ('demographics', 'death_rate'),
            'urbanization_pct': ('demographics', 'urbanization_pct'),
            'gdp_ppp_billions': ('economy', 'gdp_ppp_billions'),
            'gdp_growth_pct': ('economy', 'gdp_growth_pct'),
            'gdp_per_capita': ('economy', 'gdp_per_capita'),
            'inflation_pct': ('economy', 'inflation_pct'),
            'unemployment_pct': ('economy', 'unemployment_pct'),
            'poverty_pct': ('economy', 'poverty_pct'),
            'exports_billions': ('economy', 'exports_billions'),
            'imports_billions': ('economy', 'imports_billions'),
            'external_debt_billions': ('economy', 'external_debt_billions'),
            'oil_production_bbl_day': ('economy', 'oil_production_bbl_day'),
            'oil_consumption_bbl_day': ('economy', 'oil_consumption_bbl_day'),
            'current_account_billions': ('economy', 'current_account_billions'),
            'expenditure_pct_gdp': ('military', 'expenditure_pct_gdp'),
            'manpower_available': ('military', 'manpower_available'),
        }
        
        for metric_name, metric_data in metrics.items():
            value = get_value_for_year(metric_data, year)
            if value is not None:
                if metric_name in metric_categories:
                    category, field = metric_categories[metric_name]
                    country_data[category][field] = value
                    has_data = True
        
        if not has_data:
            continue
        
        # Build country file
        country_name = country_key_to_name(country_key)
        region = region_map.get(country_key, 'Unknown')
        
        # Fallback region detection
        if region == 'Unknown':
            # Try to infer from name patterns
            region_patterns = {
                'Africa': ['nigeria', 'egypt', 'south_africa', 'kenya', 'ethiopia', 'morocco', 'algeria', 'ghana', 'tanzania', 'uganda', 'sudan'],
                'Europe': ['germany', 'france', 'italy', 'spain', 'poland', 'romania', 'netherlands', 'belgium', 'greece', 'czechia', 'portugal', 'sweden', 'hungary', 'austria', 'switzerland', 'denmark', 'finland', 'norway', 'ireland', 'croatia', 'slovakia', 'bosnia', 'albania', 'serbia', 'slovenia', 'moldova', 'macedonia', 'montenegro', 'kosovo', 'iceland', 'luxembourg', 'malta', 'estonia', 'latvia', 'lithuania', 'belarus', 'ukraine', 'bulgaria', 'united_kingdom'],
                'North America': ['united_states', 'canada', 'mexico', 'greenland'],
                'South America': ['brazil', 'argentina', 'colombia', 'peru', 'venezuela', 'chile', 'ecuador', 'bolivia', 'paraguay', 'uruguay', 'guyana', 'suriname'],
                'Central America and Caribbean': ['guatemala', 'cuba', 'haiti', 'dominican', 'honduras', 'nicaragua', 'el_salvador', 'costa_rica', 'panama', 'jamaica', 'trinidad', 'bahamas', 'barbados', 'saint', 'belize', 'cayman', 'bermuda', 'aruba', 'curacao', 'puerto_rico', 'virgin'],
                'East & Southeast Asia': ['china', 'japan', 'south_korea', 'north_korea', 'taiwan', 'hong_kong', 'macau', 'mongolia', 'vietnam', 'thailand', 'indonesia', 'philippines', 'malaysia', 'singapore', 'myanmar', 'cambodia', 'laos', 'brunei', 'timor'],
                'South Asia': ['india', 'pakistan', 'bangladesh', 'sri_lanka', 'nepal', 'bhutan', 'afghanistan', 'maldives'],
                'Middle East': ['saudi_arabia', 'iran', 'iraq', 'israel', 'jordan', 'lebanon', 'syria', 'turkey', 'united_arab_emirates', 'qatar', 'kuwait', 'bahrain', 'oman', 'yemen', 'georgia', 'armenia', 'azerbaijan'],
                'Central Asia': ['kazakhstan', 'uzbekistan', 'turkmenistan', 'tajikistan', 'kyrgyzstan'],
                'Australia-Oceania': ['australia', 'new_zealand', 'fiji', 'papua', 'samoa', 'tonga', 'vanuatu', 'solomon', 'kiribati', 'micronesia', 'palau', 'marshall', 'nauru', 'tuvalu', 'guam'],
            }
            for r, patterns in region_patterns.items():
                if any(p in country_key.lower() for p in patterns):
                    region = r
                    break
        
        full_country_data = {
            'country': country_name,
            'region': region,
            'year': year,
            **country_data
        }
        
        # Remove empty sections
        for section in ['demographics', 'economy', 'military', 'political']:
            if not full_country_data.get(section):
                full_country_data[section] = {}
        
        # Write country file
        country_file = year_dir / f"{country_key}.json"
        with open(country_file, 'w', encoding='utf-8') as f:
            json.dump(full_country_data, f, indent=2)
        
        countries_written += 1
        
        # Add to index
        index_entries.append({
            'name': country_name,
            'region': region,
            'file': f"{country_key}.json"
        })
    
    # Write index
    if index_entries:
        # Sort by name
        index_entries.sort(key=lambda x: x['name'])
        
        index_data = {
            'year': year,
            'total_countries': len(index_entries),
            'generated_from': 'timeseries.json',
            'countries': index_entries
        }
        
        index_file = year_dir / "_index.json"
        with open(index_file, 'w', encoding='utf-8') as f:
            json.dump(index_data, f, indent=2)
    
    print(f"  Generated {year}: {countries_written} countries")
    return countries_written

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate year data folders from timeseries')
    parser.add_argument('--years', nargs='*', type=int, help='Specific years to generate')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing year folders')
    parser.add_argument('--list-years', action='store_true', help='List available years and exit')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("GeoForecaster Year Folder Generator")
    print("=" * 60)
    
    # Load data
    print(f"\nLoading timeseries from {TIMESERIES_FILE}...")
    timeseries = load_timeseries()
    print(f"  Loaded {len(timeseries)} countries")
    
    # Get available years
    available_years = get_available_timeseries_years(timeseries)
    print(f"  Years in timeseries: {min(available_years)}-{max(available_years)} ({len(available_years)} years)")
    
    if args.list_years:
        print(f"\nAvailable years: {', '.join(map(str, available_years))}")
        
        # Show which have folders
        existing = [y for y in available_years if (DATA_DIR / str(y)).exists()]
        missing = [y for y in available_years if y not in existing]
        print(f"Existing folders: {', '.join(map(str, existing))}")
        print(f"Missing folders:  {', '.join(map(str, missing))}")
        return 0
    
    # Load template for region mappings
    print(f"\nLoading template index from {TEMPLATE_YEAR}...")
    template_index = load_template_index(TEMPLATE_YEAR)
    print(f"  Template has {len(template_index.get('countries', []))} countries")
    
    # Determine years to generate
    years_to_generate = args.years if args.years else available_years
    
    # Filter out years that already exist (unless overwrite)
    if not args.overwrite:
        years_to_generate = [y for y in years_to_generate if not (DATA_DIR / str(y)).exists()]
    
    if not years_to_generate:
        print("\nNo years to generate (all exist). Use --overwrite to regenerate.")
        return 0
    
    print(f"\nGenerating {len(years_to_generate)} year folders...")
    
    total_countries = 0
    for year in sorted(years_to_generate):
        count = generate_year_folder(year, timeseries, template_index, overwrite=args.overwrite)
        total_countries += count
    
    print("\n" + "=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Years generated: {len(years_to_generate)}")
    print(f"Total country files: {total_countries}")
    
    # Verify
    print("\nVerifying data folders...")
    all_years = sorted([int(d.name) for d in DATA_DIR.iterdir() if d.is_dir() and d.name.isdigit()])
    print(f"  Available year folders: {', '.join(map(str, all_years))}")
    
    return 0

if __name__ == '__main__':
    sys.exit(main())
