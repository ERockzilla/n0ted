#!/usr/bin/env python3
"""
CIA World Factbook Multi-File Extractor

Extracts data from modern Factbook editions (2015, 2020+) that use 
per-country HTML files and rawdata text files.

The rawdata text files in the fields/ directory provide the cleanest
data source - simple tab-separated values for each field across all countries.

Usage:
    python extract_factbook_multifile.py factbook-2020 --year 2020
    python extract_factbook_multifile.py factbook-2015 --year 2015
"""

import argparse
import json
import os
import re
from pathlib import Path
from collections import defaultdict

# Map field numbers to our JSON structure
# Format: field_number -> (section, field_name, value_type)
FIELD_MAP = {
    # Demographics
    '335': ('demographics', 'population', 'population'),
    '343': ('demographics', 'median_age', 'first_number'),
    '344': ('demographics', 'population_growth_pct', 'percent'),
    '355': ('demographics', 'life_expectancy', 'first_number'),
    '345': ('demographics', 'birth_rate', 'first_number'),
    '346': ('demographics', 'death_rate', 'first_number'),
    '349': ('demographics', 'urbanization_pct', 'percent'),
    
    # Economy  
    '208': ('economy', 'gdp_ppp_billions', 'billions'),
    '210': ('economy', 'gdp_growth_pct', 'percent'),
    '211': ('economy', 'gdp_per_capita', 'dollars'),
    '229': ('economy', 'inflation_pct', 'percent'),
    '373': ('economy', 'unemployment_pct', 'percent'),
    '227': ('economy', 'poverty_pct', 'percent'),
    '239': ('economy', 'exports_billions', 'billions'),
    '242': ('economy', 'imports_billions', 'billions'),
    '246': ('economy', 'external_debt_billions', 'billions'),
    
    # Military
    '330': ('military', 'expenditure_pct_gdp', 'percent'),
}

# Field titles for reference (extracted from file headers)
FIELD_TITLES = {}


def parse_value(text: str, value_type: str):
    """Parse value based on type."""
    if not text:
        return None
    
    # Remove $ sign and commas for number parsing
    text = text.strip().replace('$', '').replace(',', '')
    
    if value_type == 'population':
        # Just get the number
        match = re.search(r'([\d]+)', text)
        if match:
            try:
                return int(match.group(1))
            except:
                return None
    
    elif value_type == 'first_number':
        match = re.search(r'(-?[\d.]+)', text)
        if match:
            try:
                return float(match.group(1))
            except:
                return None
    
    elif value_type == 'percent':
        match = re.search(r'(-?[\d.]+)', text)
        if match:
            try:
                return float(match.group(1))
            except:
                return None
    
    elif value_type == 'billions':
        # For raw dollar amounts like "2377156000000", convert to billions
        # Check for trillion/billion keywords first
        text_lower = text.lower()
        if 'trillion' in text_lower:
            match = re.search(r'([\d.]+)', text)
            if match:
                return float(match.group(1)) * 1000
        elif 'billion' in text_lower:
            match = re.search(r'([\d.]+)', text)
            if match:
                return float(match.group(1))
        else:
            # Raw number - divide by 1 billion
            match = re.search(r'([\d]+)', text)
            if match:
                val = float(match.group(1))
                # Convert to billions (divide by 1,000,000,000)
                return round(val / 1_000_000_000, 2)

    
    elif value_type == 'dollars':
        match = re.search(r'([\d]+)', text)
        if match:
            return int(match.group(1))
    
    return None


def parse_rawdata_file(filepath: Path) -> dict:
    """Parse a rawdata_*.txt file and return country->value mapping."""
    results = {}
    
    if not filepath.exists():
        return results
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    
    if not lines:
        return results
    
    # First line is the title (e.g., "Country Comparison :: Population")
    title = lines[0].strip() if lines else ''
    
    # Parse each data line
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        
        # Format: rank  country_name  value  [date estimate]
        # Split by multiple spaces to separate fields
        parts = re.split(r'\s{2,}', line)
        
        if len(parts) >= 3:
            try:
                # parts[0] is rank, parts[1] is country, parts[2] is value
                country = parts[1].strip()
                value_str = parts[2].strip()
                results[country] = value_str
            except:
                continue
    
    return results


def normalize_country_name(name: str) -> str:
    """Normalize country name for consistency and filename creation."""
    # Handle special cases
    name = name.strip()
    
    # Standard normalizations
    replacements = {
        "Korea, North": "North Korea",
        "Korea, South": "South Korea",
        "Congo, Democratic Republic of the": "Democratic Republic of the Congo",
        "Congo, Republic of the": "Republic of the Congo",
        "Bahamas, The": "Bahamas",
        "Gambia, The": "Gambia",
        "Cote d'Ivoire": "Ivory Coast",
        "Burma": "Myanmar",
    }
    
    return replacements.get(name, name)


def extract_from_factbook_dir(factbook_dir: str, year: int) -> list:
    """Extract country data from a Factbook directory structure."""
    factbook_path = Path(factbook_dir)
    fields_path = factbook_path / "fields"
    
    if not fields_path.exists():
        print(f"Error: fields directory not found at {fields_path}")
        return []
    
    # Collect all data by country
    country_data = defaultdict(lambda: {
        'country': '',
        'region': '',  # We may not have region in rawdata
        'year': year,
        'demographics': {},
        'economy': {},
        'military': {},
        'political': {}
    })
    
    # Process each field's rawdata file
    for field_num, (section, field_name, value_type) in FIELD_MAP.items():
        rawdata_file = fields_path / f"rawdata_{field_num}.txt"
        
        if not rawdata_file.exists():
            print(f"  Skipping field {field_num} ({field_name}): rawdata file not found")
            continue
        
        print(f"  Processing field {field_num}: {field_name}")
        field_data = parse_rawdata_file(rawdata_file)
        
        for country, value_str in field_data.items():
            normalized_name = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized_name]['country'] = normalized_name
                country_data[normalized_name][section][field_name] = value
    
    # Convert to list and filter out empty entries
    countries = []
    for country_name, data in country_data.items():
        # Only include if we have some meaningful data
        has_data = any([
            data['demographics'],
            data['economy'],
            data['military'],
            data['political']
        ])
        if has_data:
            countries.append(data)
    
    return countries


def save_countries(countries: list, output_dir: Path):
    """Save each country as a separate JSON file."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    index = {
        'year': countries[0]['year'] if countries else None,
        'total_countries': len(countries),
        'countries': []
    }
    
    for country in countries:
        # Create filename from country name
        filename = re.sub(r'[^\w\s-]', '', country['country'].lower())
        filename = re.sub(r'\s+', '_', filename)
        filepath = output_dir / f"{filename}.json"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(country, f, indent=2)
            
        index['countries'].append({
            'name': country['country'],
            'region': country.get('region', ''),
            'file': f"{filename}.json"
        })
    
    # Save index
    with open(output_dir / '_index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)
        
    print(f"Saved {len(countries)} countries to {output_dir}")


def main():
    parser = argparse.ArgumentParser(
        description='Extract CIA World Factbook data from multi-file editions'
    )
    parser.add_argument(
        'input_dir', 
        help='Path to Factbook directory (e.g., factbook-2020)'
    )
    parser.add_argument(
        '--year', 
        type=int, 
        required=True, 
        help='Factbook year (e.g., 2020)'
    )
    parser.add_argument(
        '--output-dir', 
        default='data', 
        help='Output directory (default: data)'
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_dir):
        print(f"Error: Directory not found: {args.input_dir}")
        return 1
    
    print(f"Extracting {args.year} Factbook from {args.input_dir}...")
    countries = extract_from_factbook_dir(args.input_dir, args.year)
    
    if not countries:
        print("No countries extracted!")
        return 1
    
    output_path = Path(args.output_dir) / str(args.year)
    save_countries(countries, output_path)
    
    print(f"\nDone! Extracted {len(countries)} countries.")
    print(f"Files saved to: {output_path}")
    return 0


if __name__ == '__main__':
    exit(main())
