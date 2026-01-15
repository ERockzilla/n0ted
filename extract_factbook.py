#!/usr/bin/env python3
"""
CIA World Factbook Extractor

Extracts time-varying data from Factbook HTML into per-country JSON files.
Streams line-by-line to handle large files efficiently (~18MB).

Usage:
    python extract_factbook.py pg35830-images.html --year 2010
"""

import argparse
import json
import os
import re
from pathlib import Path
from html.parser import HTMLParser
from typing import Optional

# Regex patterns for parsing
COUNTRY_START = re.compile(r'@([A-Za-z\s\-\'\.,]+)\s*\(([^)]+)\)')
SECTION_HEADER = re.compile(r'(Introduction|Geography|People|Government|Economy|Communications|Transportation|Military)\s*::')

# Numeric value patterns  
BILLION_PATTERN = re.compile(r'\$?([\d,.]+)\s*billion', re.IGNORECASE)
MILLION_PATTERN = re.compile(r'\$?([\d,.]+)\s*million', re.IGNORECASE)
TRILLION_PATTERN = re.compile(r'\$?([\d,.]+)\s*trillion', re.IGNORECASE)
PERCENT_PATTERN = re.compile(r'(-?[\d,.]+)\s*%')
PLAIN_NUMBER = re.compile(r'^([\d,]+)\s')
YEAR_NUMBER = re.compile(r'([\d,.]+)\s*years')
DATE_PATTERN = re.compile(r'(\d{1,2}\s+\w+\s+\d{4})')


class TextExtractor(HTMLParser):
    """Strip HTML tags and extract text content."""
    
    def __init__(self):
        super().__init__()
        self.text_parts = []
        
    def handle_data(self, data):
        self.text_parts.append(data)
        
    def get_text(self):
        return ' '.join(self.text_parts).strip()


def strip_html(html: str) -> str:
    """Remove HTML tags from a string."""
    extractor = TextExtractor()
    try:
        extractor.feed(html)
        return extractor.get_text()
    except:
        return re.sub(r'<[^>]+>', ' ', html).strip()


class FactbookExtractor:
    """Stream-parses Factbook HTML and extracts country data."""
    
    # Fields to look for - labels appear on separate line from values
    FIELD_CONFIG = {
        # Demographics
        'Population:': ('demographics', 'population', 'population'),
        'Population growth rate:': ('demographics', 'population_growth_pct', 'percent'),
        'Life expectancy at birth:': ('demographics', 'life_expectancy', 'years'),
        'Median age:': ('demographics', 'median_age', 'years'),
        'Birth rate:': ('demographics', 'birth_rate', 'first_number'),
        'Death rate:': ('demographics', 'death_rate', 'first_number'),
        'urban population:': ('demographics', 'urbanization_pct', 'percent'),
        
        # Economy
        'GDP (purchasing power parity):': ('economy', 'gdp_ppp_billions', 'billions'),
        'GDP - real growth rate:': ('economy', 'gdp_growth_pct', 'percent'),
        'GDP - per capita (PPP):': ('economy', 'gdp_per_capita', 'dollars'),
        'Inflation rate (consumer prices):': ('economy', 'inflation_pct', 'percent'),
        'Unemployment rate:': ('economy', 'unemployment_pct', 'percent'),
        'Population below poverty line:': ('economy', 'poverty_pct', 'percent'),
        'Exports:': ('economy', 'exports_billions', 'billions'),
        'Imports:': ('economy', 'imports_billions', 'billions'),
        'Debt - external:': ('economy', 'external_debt_billions', 'billions'),
        'Oil - production:': ('economy', 'oil_production_bbl_day', 'plain_int'),
        'Oil - consumption:': ('economy', 'oil_consumption_bbl_day', 'plain_int'),
        'Natural gas - production:': ('economy', 'gas_production_cu_m', 'plain_int'),
        'Electricity - production:': ('economy', 'electricity_kwh', 'plain_int'),
        'Current account balance:': ('economy', 'current_account_billions', 'billions'),
        
        # Military
        'Military expenditures:': ('military', 'expenditure_pct_gdp', 'percent'),
        'Manpower available for military service:': ('military', 'manpower_available', 'plain_int'),
    }
    
    def __init__(self, year: int):
        self.year = year
        self.countries = []
        self.current_country = None
        self.current_section = None
        self.pending_field = None  # The field label we're waiting for value
        self.line_buffer = []
        
    def process_file(self, filepath: str) -> list:
        """Stream process the HTML file."""
        print(f"Processing {filepath}...")
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            for line_num, line in enumerate(f, 1):
                self._process_line(line, line_num)
                
                if line_num % 100000 == 0:
                    print(f"  Processed {line_num:,} lines...")
        
        # Save final country
        if self.current_country:
            self._finalize_country()
            
        print(f"Extracted {len(self.countries)} countries")
        return self.countries
    
    def _process_line(self, line: str, line_num: int):
        """Process a single line of HTML."""
        text = strip_html(line).strip()
        if not text:
            return
            
        # Check for new country marker
        match = COUNTRY_START.search(text)
        if match:
            if self.current_country:
                self._finalize_country()
            self._start_country(match.group(1).strip(), match.group(2).strip())
            self.pending_field = None
            return
            
        if not self.current_country:
            return
            
        # Check for section header
        match = SECTION_HEADER.search(text)
        if match:
            self.current_section = match.group(1)
            self.pending_field = None
            return
        
        # If we have a pending field, this line might be its value
        if self.pending_field:
            self._extract_value(text, self.pending_field)
            self.pending_field = None
            
        # Check if this line is a field label
        for label, config in self.FIELD_CONFIG.items():
            if label.lower() in text.lower():
                # Check if the value is on the same line (after colon)
                parts = text.split(':', 1)
                if len(parts) > 1 and parts[1].strip():
                    self._extract_value(parts[1], config)
                else:
                    # Value is on next line
                    self.pending_field = config
                break
                
        # Also check for political leaders (special handling)
        if self.current_section == 'Government':
            self._extract_political(text)
    
    def _start_country(self, name: str, region: str):
        """Initialize a new country record."""
        self.current_country = {
            'country': name,
            'region': region,
            'year': self.year,
            'demographics': {},
            'economy': {},
            'military': {},
            'political': {}
        }
        self.current_section = None
        
    def _finalize_country(self):
        """Save current country and reset."""
        if self.current_country and self.current_country['country']:
            # Only save if we have some meaningful data
            has_data = any([
                self.current_country['demographics'],
                self.current_country['economy'],
                self.current_country['military'],
                self.current_country['political']
            ])
            if has_data:
                self.countries.append(self.current_country)
        self.current_country = None
                
    def _extract_value(self, text: str, config: tuple):
        """Extract and parse a field value."""
        section, field_name, parser_type = config
        value = self._parse_value(text, parser_type)
        if value is not None:
            self.current_country[section][field_name] = value
            
    def _parse_value(self, text: str, parser_type: str):
        """Parse value based on type."""
        text = text.strip()
        
        if parser_type == 'population':
            # Population must be at least 5 digits (10,000+) to avoid rank numbers
            match = re.search(r'^([\d,]{5,})', text)
            if match:
                try:
                    return int(match.group(1).replace(',', ''))
                except:
                    return None
            return None
        
        if parser_type == 'plain_int':
            # Match first number in text
            match = re.search(r'([\d,]+)', text)
            if match:
                try:
                    return int(match.group(1).replace(',', ''))
                except:
                    return None
                    
        elif parser_type == 'percent':
            match = PERCENT_PATTERN.search(text)
            if match:
                try:
                    return float(match.group(1).replace(',', ''))
                except:
                    return None
                    
        elif parser_type == 'billions':
            # Try trillion first
            match = TRILLION_PATTERN.search(text)
            if match:
                return float(match.group(1).replace(',', '')) * 1000
            # Then billion
            match = BILLION_PATTERN.search(text)
            if match:
                return float(match.group(1).replace(',', ''))
            # Then million (convert to billions)
            match = MILLION_PATTERN.search(text)
            if match:
                return float(match.group(1).replace(',', '')) / 1000
            return None
            
        elif parser_type == 'years':
            # Look for "X years" or just a number
            match = YEAR_NUMBER.search(text)
            if match:
                return float(match.group(1).replace(',', ''))
            match = re.search(r'total[:\s]+([\d.]+)', text.lower())
            if match:
                return float(match.group(1))
            match = re.search(r'^([\d.]+)', text)
            if match:
                return float(match.group(1))
            return None
            
        elif parser_type == 'first_number':
            # Get first decimal number in text
            match = re.search(r'([\d.]+)', text)
            if match:
                return float(match.group(1))
            return None
            
        elif parser_type == 'dollars':
            # Parse dollar amounts - could be thousands or no suffix
            match = re.search(r'\$?([\d,]+)', text)
            if match:
                return int(match.group(1).replace(',', ''))
            return None
            
        return None
        
    def _extract_political(self, text: str):
        """Extract political/leadership data."""
        text_lower = text.lower()
        
        if 'chief of state:' in text_lower:
            # Extract name - remove title prefixes
            parts = text.split(':', 1)
            if len(parts) > 1:
                name = parts[1].strip()
                # Try to get actual name after title like "President"
                name_match = re.search(r'(?:President|King|Queen|Prime Minister|Chairman)\s+(.+?)(?:\s*\(|;|$)', name)
                if name_match:
                    name = name_match.group(1).strip()
                else:
                    name = re.split(r'[;(]', name)[0].strip()
                if name and len(name) > 2:
                    self.current_country['political']['chief_of_state'] = name[:80]
                
        elif 'head of government:' in text_lower:
            parts = text.split(':', 1)
            if len(parts) > 1:
                name = parts[1].strip()
                name_match = re.search(r'(?:President|Prime Minister|Chancellor|Premier)\s+(.+?)(?:\s*\(|;|$)', name)
                if name_match:
                    name = name_match.group(1).strip()
                else:
                    name = re.split(r'[;(]', name)[0].strip()
                if name and len(name) > 2:
                    self.current_country['political']['head_of_government'] = name[:80]
                
        elif 'election' in text_lower and 'last held' in text_lower:
            match = DATE_PATTERN.search(text)
            if match:
                self.current_country['political']['last_election'] = match.group(1)


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
            'region': country['region'],
            'file': f"{filename}.json"
        })
        
    # Save index
    with open(output_dir / '_index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)
        
    print(f"Saved {len(countries)} countries to {output_dir}")


def main():
    parser = argparse.ArgumentParser(description='Extract CIA World Factbook data')
    parser.add_argument('input_file', help='Path to Factbook HTML file')
    parser.add_argument('--year', type=int, required=True, help='Factbook year (e.g., 2010)')
    parser.add_argument('--output-dir', default='data', help='Output directory')
    
    args = parser.parse_args()
    
    if not os.path.exists(args.input_file):
        print(f"Error: File not found: {args.input_file}")
        return 1
        
    extractor = FactbookExtractor(args.year)
    countries = extractor.process_file(args.input_file)
    
    output_path = Path(args.output_dir) / str(args.year)
    save_countries(countries, output_path)
    
    print(f"\nDone! Run 'ls {output_path}' to see extracted files.")
    return 0


if __name__ == '__main__':
    exit(main())
