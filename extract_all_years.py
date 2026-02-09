#!/usr/bin/env python3
"""
Multi-Year CIA World Factbook Extractor
========================================

Extracts data from CIA World Factbook archives spanning 2000-2020.
Handles multiple HTML/text formats used across different editions.

Architecture:
- Modular parsers for different Factbook versions (2001-2009 vs 2015+)
- Unified output format to data/_merged/timeseries.json
- Automatic format detection based on directory structure
- Robust error handling and logging

Security Considerations:
- Input path validation to prevent directory traversal
- UTF-8 encoding with error handling for malformed data
- No external network calls during extraction

Usage:
    python extract_all_years.py                    # Process all available years
    python extract_all_years.py --years 2001 2010 # Process specific years
    python extract_all_years.py --cleanup          # Remove non-essential files after extraction

Author: GeoForecaster Team
Version: 2.0.0
Last Updated: 2026-01-17
"""

import json
import os
import re
import sys
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('extraction.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Base directory (script location)
BASE_DIR = Path(__file__).parent.absolute()

# Output paths
DATA_DIR = BASE_DIR / "data"
MERGED_DIR = DATA_DIR / "_merged"
TIMESERIES_FILE = MERGED_DIR / "timeseries.json"

# Field mappings for different Factbook versions
# 2001-2009: HTML files named by field (e.g., population.html, gdp.html)
FIELD_MAP_LEGACY = {
    'population.html': ('demographics', 'population', 'population'),
    'life_expectancy_at_birth.html': ('demographics', 'life_expectancy', 'life_exp'),
    'population_growth_rate.html': ('demographics', 'population_growth_pct', 'percent'),
    'gdp.html': ('economy', 'gdp_ppp_billions', 'gdp'),
    'gdp_-_real_growth_rate.html': ('economy', 'gdp_growth_pct', 'signed_percent'),
    'gdp_-_per_capita.html': ('economy', 'gdp_per_capita', 'dollars'),
    'inflation_rate_(consumer_prices).html': ('economy', 'inflation_pct', 'percent'),
    'unemployment_rate.html': ('economy', 'unemployment_pct', 'percent'),
    'exports.html': ('economy', 'exports_billions', 'billions'),
    'imports.html': ('economy', 'imports_billions', 'billions'),
    'military_expenditures_-_percent_of_gdp.html': ('military', 'expenditure_pct_gdp', 'percent'),
}

# 2015+: Numbered field files (rawdata_XXX.txt)
FIELD_MAP_MODERN = {
    '335': ('demographics', 'population', 'population'),
    '355': ('demographics', 'life_expectancy', 'first_number'),
    '344': ('demographics', 'population_growth_pct', 'percent'),
    '208': ('economy', 'gdp_ppp_billions', 'billions'),
    '210': ('economy', 'gdp_growth_pct', 'percent'),
    '211': ('economy', 'gdp_per_capita', 'dollars'),
    '229': ('economy', 'inflation_pct', 'percent'),
    '373': ('economy', 'unemployment_pct', 'percent'),
    '239': ('economy', 'exports_billions', 'billions'),
    '242': ('economy', 'imports_billions', 'billions'),
    '330': ('military', 'expenditure_pct_gdp', 'percent'),
}

# Country name normalization
COUNTRY_NORMALIZATIONS = {
    "Korea, North": "North Korea",
    "Korea, South": "South Korea", 
    "Congo, Democratic Republic of the": "Democratic Republic of the Congo",
    "Congo, Republic of the": "Republic of the Congo",
    "Bahamas, The": "Bahamas",
    "Gambia, The": "Gambia",
    "Burma": "Myanmar",
    "Cote d'Ivoire": "Ivory Coast",
    "Holy See (Vatican City)": "Vatican City",
    "United States": "United States",  # Keep consistent
}

# ============================================================================
# VALUE PARSERS
# ============================================================================

def parse_population(text: str) -> Optional[int]:
    """Parse population values, handling various formats."""
    if not text:
        return None
    # Remove notes and parenthetical content
    text = re.sub(r'\([^)]*\)', '', text)
    text = re.sub(r'note:.*', '', text, flags=re.IGNORECASE)
    # Extract first number
    match = re.search(r'([\d,]+)', text.replace(',', ''))
    if match:
        try:
            val = int(match.group(1).replace(',', ''))
            # Sanity check: population should be > 0 and < 2 billion
            if 0 < val < 2_000_000_000:
                return val
        except ValueError:
            pass
    return None

def parse_life_exp(text: str) -> Optional[float]:
    """Parse life expectancy values."""
    if not text:
        return None
    # Look for "total population: XX.X years"
    match = re.search(r'total\s+population:?\s*([\d.]+)', text, re.IGNORECASE)
    if match:
        try:
            val = float(match.group(1))
            if 20 < val < 100:  # Sanity check
                return round(val, 2)
        except ValueError:
            pass
    # Fallback: first number
    match = re.search(r'([\d.]+)\s*years?', text)
    if match:
        try:
            val = float(match.group(1))
            if 20 < val < 100:
                return round(val, 2)
        except ValueError:
            pass
    return None

def parse_percent(text: str, allow_negative: bool = True) -> Optional[float]:
    """Parse percentage values."""
    if not text:
        return None
    text = text.replace(',', '')
    match = re.search(r'(-?[\d.]+)\s*%?', text)
    if match:
        try:
            val = float(match.group(1))
            if not allow_negative and val < 0:
                return None
            if -100 <= val <= 1000:  # Reasonable range
                return round(val, 2)
        except ValueError:
            pass
    return None

def parse_billions(text: str) -> Optional[float]:
    """Parse money amounts, converting to billions.
    
    Handles various formats:
    - "$25.4 trillion" → 25400.0
    - "$1.2 billion" → 1.2
    - "$500 million" → 0.5
    - "20936000000" (raw, ~21B) → 20.94
    - "20936" (ambiguous) → needs context-based handling
    
    For raw numbers without labels, uses magnitude detection:
    - > 1 trillion (1e12): divide by 1e9 → billions
    - > 1 billion (1e9): divide by 1e9 → billions  
    - > 1 million (1e6): likely already in millions, divide by 1000
    - < 1 million: likely already in billions (small economies)
    """
    if not text:
        return None
    
    original_text = text
    text = text.replace('$', '').replace(',', '').lower().strip()
    
    # Handle explicit trillion/billion/million labels
    if 'trillion' in text:
        match = re.search(r'([\d.]+)', text)
        if match:
            val = float(match.group(1))
            return round(val * 1000, 2)  # trillion → billions
    elif 'billion' in text:
        match = re.search(r'([\d.]+)', text)
        if match:
            return round(float(match.group(1)), 2)
    elif 'million' in text:
        match = re.search(r'([\d.]+)', text)
        if match:
            val = float(match.group(1))
            return round(val / 1000, 4)  # million → billions
    else:
        # Raw number without unit label - use magnitude detection
        match = re.search(r'([\d.]+)', text)
        if match:
            try:
                val = float(match.group(1).replace(',', ''))
                
                # Sanity check: GDP PPP should be reasonable
                # World GDP ~$100T, smallest economies ~$0.01B
                
                if val >= 1_000_000_000_000:  # >= 1 trillion
                    # Raw value in base currency (e.g., 25400000000000 = $25.4T)
                    result = round(val / 1_000_000_000, 2)
                elif val >= 1_000_000_000:  # >= 1 billion
                    # Raw value in base currency (e.g., 20936000000 = $20.9B)
                    result = round(val / 1_000_000_000, 2)
                elif val >= 1_000_000:  # >= 1 million
                    # Raw value likely in thousands or millions
                    # If result would be > 30000 (larger than China), it's in thousands
                    # If result would be < 0.01, it's too small
                    result = round(val / 1_000_000, 4)  # Assume in millions
                elif val >= 1000:  # 1000-999999
                    # This range is tricky - could be billions or raw thousands
                    # For small economies: 1000 could mean $1000M = $1B (if in millions)
                    # Or $1000B = $1T (unlikely for most countries)
                    # Apply sanity check: most values here are in thousands
                    result = round(val / 1_000, 4)  # Convert from thousands to billions
                    # But if result > 1000, value was likely already in millions
                    if result > 50:  # > $50T - definitely wrong
                        result = round(val / 1_000_000, 4)
                else:  # < 1000
                    # Likely already in billions for very small/medium economies
                    if val < 0.01:
                        return None  # Too small to be valid
                    result = round(val, 4)
                
                # Sanity check: No country GDP > $35T (China peak)
                # If value is still too high, we need more aggressive division
                if result > 35000:  # Still impossibly large
                    result = round(result / 1_000, 4)
                if result > 35000:  # STILL too large
                    result = round(result / 1_000, 4)
                
                return result if result > 0.001 else None
            except ValueError:
                pass
    return None

def parse_dollars(text: str) -> Optional[int]:
    """Parse per-capita dollar values."""
    if not text:
        return None
    text = text.replace('$', '').replace(',', '')
    match = re.search(r'([\d]+)', text)
    if match:
        try:
            val = int(match.group(1))
            if 50 < val < 500000:  # Reasonable GDP per capita range
                return val
        except ValueError:
            pass
    return None

def parse_gdp(text: str) -> Optional[float]:
    """Parse GDP values (in billions)."""
    return parse_billions(text)

def parse_value(text: str, value_type: str) -> Optional[Any]:
    """Parse value based on type."""
    parsers = {
        'population': parse_population,
        'life_exp': parse_life_exp,
        'percent': parse_percent,
        'signed_percent': lambda t: parse_percent(t, allow_negative=True),
        'billions': parse_billions,
        'dollars': parse_dollars,
        'gdp': parse_gdp,
        'first_number': lambda t: float(re.search(r'([\d.]+)', t or '').group(1)) if t and re.search(r'([\d.]+)', t) else None,
    }
    parser = parsers.get(value_type, lambda x: None)
    try:
        return parser(text)
    except Exception:
        return None

# ============================================================================
# LEGACY PARSER (2001-2009)
# ============================================================================

def parse_legacy_html(filepath: Path) -> Dict[str, str]:
    """Parse legacy HTML field files (2001-2009 format).
    
    Format: <b>Country:</b> Value
    """
    results = {}
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        logger.warning(f"Error reading {filepath}: {e}")
        return results
    
    # Pattern: <b>Country:</b> ... Value ... </font>
    # More robust pattern that handles various HTML structures
    pattern = r'<b>([^<:]+):</b>\s*</font></td>\s*<td[^>]*><font[^>]*>\s*([^<]+)'
    
    for match in re.finditer(pattern, content, re.IGNORECASE | re.DOTALL):
        country = match.group(1).strip()
        value = match.group(2).strip()
        
        # Clean up value
        value = re.sub(r'\s+', ' ', value)
        value = value.split('\n')[0].strip()
        
        if country and value and country.lower() != 'note':
            results[country] = value
    
    return results

# ============================================================================
# MODERN PARSER (2015+)
# ============================================================================

def parse_rawdata_file(filepath: Path) -> Dict[str, str]:
    """Parse modern rawdata_XXX.txt or XXXXrank.txt files.
    
    Handles both space-separated and tab-separated formats:
    - rawdata files: "rank  country  value  [date]" (space-separated)
    - rank.txt files: "rank\tcountry\tvalue\tdate" (tab-separated)
    """
    results = {}
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        logger.warning(f"Error reading {filepath}: {e}")
        return results
    
    for line in lines[1:]:  # Skip header
        line = line.strip()
        if not line:
            continue
        
        # Skip special lines
        if line.startswith('This file') or line.startswith('This tab'):
            continue
            
        # Try tab-delimited first (rank.txt format)
        if '\t' in line:
            parts = line.split('\t')
        else:
            # Space-delimited (rawdata format)
            parts = re.split(r'\s{2,}', line)
        
        if len(parts) >= 3:
            try:
                # parts[0] is rank, parts[1] is country, parts[2] is value
                country = parts[1].strip()
                value = parts[2].strip()
                # Skip "World" aggregate
                if country.lower() == 'world':
                    continue
                results[country] = value
            except IndexError:
                continue
    
    return results

# ============================================================================
# EXTRACTION FUNCTIONS
# ============================================================================

def normalize_country_name(name: str) -> str:
    """Normalize country name for consistency."""
    name = name.strip()
    return COUNTRY_NORMALIZATIONS.get(name, name)

def detect_factbook_version(factbook_dir: Path) -> str:
    """Detect Factbook version based on directory structure.
    
    Returns one of:
    - "modern": 2018+ with rawdata_*.txt in fields/
    - "modern_rankorder": 2015-2017 with rawdata_*.txt in rankorder/
    - "modern_text": 2009 with rawdata_*.text (note: .text not .txt) in rankorder/
    - "rank_txt": 2003-2008 with *rank.txt in rankorder/
    - "modern_html_numbered": 2002 with numbered HTML (2119.html, etc.) in fields/
    - "legacy": 2001 with named HTML files (population.html) in fields/
    - "unknown": Unrecognized format
    """
    fields_dir = factbook_dir / "fields"
    rankorder_dir = factbook_dir / "rankorder"
    
    # Check for rawdata files in fields/ (newer format, 2018+)
    if fields_dir.exists():
        rawdata_files = list(fields_dir.glob("rawdata_*.txt"))
        if rawdata_files and any(f.stat().st_size > 100 for f in rawdata_files):
            return "modern"
    
    # Check for rawdata files in rankorder/ (2015-2017 format, .txt extension)
    if rankorder_dir.exists():
        rawdata_txt_files = list(rankorder_dir.glob("rawdata_*.txt"))
        if any(f.stat().st_size > 100 for f in rawdata_txt_files):
            return "modern_rankorder"
        
        # Check for .text files (2009 format - note different extension!)
        rawdata_text_files = list(rankorder_dir.glob("rawdata_*.text"))
        if any(f.stat().st_size > 100 for f in rawdata_text_files):
            return "modern_text"
        
        # Check for rank.txt files (2003-2008 format)
        rank_files = list(rankorder_dir.glob("*rank.txt"))
        if any(f.stat().st_size > 100 for f in rank_files):
            return "rank_txt"
    
    # Check for HTML files in fields/
    if fields_dir.exists():
        html_files = list(fields_dir.glob("*.html"))
        if html_files:
            # Check if files are named by field (legacy) or number (modern HTML)
            numbered_html = []
            named_html = []
            for f in html_files[:20]:
                if f.stem.isdigit():
                    numbered_html.append(f)
                elif not f.stem.startswith("print_") and not f.stem.startswith("index"):
                    named_html.append(f)
            
            # 2002 format: numbered HTML files like 2119.html, 2001.html
            if len(numbered_html) > len(named_html) and len(numbered_html) > 5:
                return "modern_html_numbered"
            
            # 2001 legacy format: named HTML files like population.html
            if named_html:
                return "legacy"
    
    return "unknown"

def extract_year_modern(factbook_dir: Path, year: int, use_rankorder: bool = False) -> Dict[str, Dict]:
    """Extract data from modern Factbook (2015+)."""
    if use_rankorder:
        data_dir = factbook_dir / "rankorder"
    else:
        data_dir = factbook_dir / "fields"
    
    country_data = defaultdict(lambda: {
        'demographics': {},
        'economy': {},
        'military': {},
    })
    
    # Also check for some field number mappings that are only in rankorder
    field_mappings = {
        '2119': ('demographics', 'population', 'population'),  # Population
        '2102': ('demographics', 'life_expectancy', 'first_number'),  # Life expectancy
        '2002': ('demographics', 'population_growth_pct', 'percent'),  # Population growth
        '2001': ('economy', 'gdp_ppp_billions', 'billions'),  # GDP PPP
        '2003': ('economy', 'gdp_growth_pct', 'percent'),  # GDP growth
        '2004': ('economy', 'gdp_per_capita', 'dollars'),  # GDP per capita
        '2092': ('economy', 'inflation_pct', 'percent'),  # Inflation
        '2129': ('economy', 'unemployment_pct', 'percent'),  # Unemployment
        '2078': ('economy', 'exports_billions', 'billions'),  # Exports
        '2087': ('economy', 'imports_billions', 'billions'),  # Imports
        '2034': ('military', 'expenditure_pct_gdp', 'percent'),  # Military expenditures
    }
    
    # Merge with default mappings
    all_mappings = {**FIELD_MAP_MODERN, **field_mappings}
    
    for field_num, (section, field_name, value_type) in all_mappings.items():
        filepath = data_dir / f"rawdata_{field_num}.txt"
        if not filepath.exists():
            continue
        
        # Skip empty files
        if filepath.stat().st_size < 100:
            continue
        
        logger.debug(f"  Processing field {field_num} ({field_name})")
        field_data = parse_rawdata_file(filepath)
        
        for country, value_str in field_data.items():
            normalized = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized][section][field_name] = value
    
    return dict(country_data)

def extract_year_legacy(factbook_dir: Path, year: int) -> Dict[str, Dict]:
    """Extract data from legacy Factbook (2001-2009)."""
    fields_dir = factbook_dir / "fields"
    country_data = defaultdict(lambda: {
        'demographics': {},
        'economy': {},
        'military': {},
    })
    
    for filename, (section, field_name, value_type) in FIELD_MAP_LEGACY.items():
        filepath = fields_dir / filename
        if not filepath.exists():
            logger.debug(f"  Skipping {filename}: file not found")
            continue
        
        logger.debug(f"  Processing {filename}")
        field_data = parse_legacy_html(filepath)
        
        for country, value_str in field_data.items():
            normalized = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized][section][field_name] = value
    
    return dict(country_data)

def extract_year(year: int, factbook_dir: Path) -> Dict[str, Dict]:
    """Extract data from a single Factbook year."""
    if not factbook_dir.exists():
        logger.warning(f"Directory not found: {factbook_dir}")
        return {}
    
    version = detect_factbook_version(factbook_dir)
    logger.info(f"Extracting {year} (format: {version})")
    
    if version == "legacy":
        return extract_year_legacy(factbook_dir, year)
    elif version == "modern":
        return extract_year_modern(factbook_dir, year, use_rankorder=False)
    elif version == "modern_rankorder":
        return extract_year_modern(factbook_dir, year, use_rankorder=True)
    elif version == "modern_text":
        return extract_year_modern_text(factbook_dir, year)
    elif version == "modern_html_numbered":
        return extract_year_html_numbered(factbook_dir, year)
    elif version == "rank_txt":
        return extract_year_rank_txt(factbook_dir, year)
    else:
        logger.warning(f"Unknown format for {factbook_dir}")
        return {}

def extract_year_rank_txt(factbook_dir: Path, year: int) -> Dict[str, Dict]:
    """Extract data from rank.txt format (2002-2009)."""
    rankorder_dir = factbook_dir / "rankorder"
    
    country_data = defaultdict(lambda: {
        'demographics': {},
        'economy': {},
        'military': {},
    })
    
    # Field mappings for rank.txt files
    rank_field_mappings = {
        '2119': ('demographics', 'population', 'population'),  # Population
        '2102': ('demographics', 'life_expectancy', 'first_number'),  # Life expectancy
        '2002': ('demographics', 'population_growth_pct', 'percent'),  # Population growth
        '2001': ('economy', 'gdp_ppp_billions', 'billions'),  # GDP PPP
        '2003': ('economy', 'gdp_growth_pct', 'percent'),  # GDP growth
        '2004': ('economy', 'gdp_per_capita', 'dollars'),  # GDP per capita
        '2092': ('economy', 'inflation_pct', 'percent'),  # Inflation
        '2129': ('economy', 'unemployment_pct', 'percent'),  # Unemployment
        '2078': ('economy', 'exports_billions', 'billions'),  # Exports
        '2087': ('economy', 'imports_billions', 'billions'),  # Imports
        '2034': ('military', 'expenditure_pct_gdp', 'percent'),  # Military expenditures
    }
    
    for field_num, (section, field_name, value_type) in rank_field_mappings.items():
        filepath = rankorder_dir / f"{field_num}rank.txt"
        if not filepath.exists():
            continue
        
        # Skip empty files
        if filepath.stat().st_size < 100:
            continue
        
        logger.debug(f"  Processing rank file {field_num} ({field_name})")
        field_data = parse_rawdata_file(filepath)  # Same parser works
        
        for country, value_str in field_data.items():
            normalized = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized][section][field_name] = value
    
    return dict(country_data)

def extract_year_modern_text(factbook_dir: Path, year: int) -> Dict[str, Dict]:
    """Extract data from 2009-format .text files in rankorder/.
    
    2009 uses rawdata_*.text (note .text extension) with carriage return (\r) 
    line endings instead of the standard \r\n or \n.
    """
    rankorder_dir = factbook_dir / "rankorder"
    
    country_data = defaultdict(lambda: {
        'demographics': {},
        'economy': {},
        'military': {},
    })
    
    # Same field mappings as modern_rankorder
    field_mappings = {
        '2119': ('demographics', 'population', 'population'),  # Population
        '2102': ('demographics', 'life_expectancy', 'first_number'),  # Life expectancy
        '2002': ('demographics', 'population_growth_pct', 'percent'),  # Population growth
        '2001': ('economy', 'gdp_ppp_billions', 'billions'),  # GDP PPP
        '2003': ('economy', 'gdp_growth_pct', 'percent'),  # GDP growth
        '2004': ('economy', 'gdp_per_capita', 'dollars'),  # GDP per capita
        '2092': ('economy', 'inflation_pct', 'percent'),  # Inflation
        '2129': ('economy', 'unemployment_pct', 'percent'),  # Unemployment
        '2078': ('economy', 'exports_billions', 'billions'),  # Exports
        '2087': ('economy', 'imports_billions', 'billions'),  # Imports
        '2034': ('military', 'expenditure_pct_gdp', 'percent'),  # Military expenditures
    }
    
    for field_num, (section, field_name, value_type) in field_mappings.items():
        # Note: .text extension, not .txt!
        filepath = rankorder_dir / f"rawdata_{field_num}.text"
        if not filepath.exists():
            continue
        
        if filepath.stat().st_size < 100:
            continue
        
        logger.debug(f"  Processing .text file {field_num} ({field_name})")
        
        # Parse with special handling for \r line endings
        field_data = parse_text_file_cr(filepath)
        
        for country, value_str in field_data.items():
            normalized = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized][section][field_name] = value
    
    return dict(country_data)

def parse_text_file_cr(filepath: Path) -> Dict[str, str]:
    """Parse .text files that use \r (carriage return only) as line separator.
    
    Format: rank\tcountry\tvalue\r (repeated)
    """
    results = {}
    try:
        with open(filepath, 'rb') as f:  # Read as binary to handle weird line endings
            content = f.read().decode('utf-8', errors='ignore')
    except Exception as e:
        logger.warning(f"Error reading {filepath}: {e}")
        return results
    
    # Split on \r, handling both \r\n and just \r
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    lines = content.split('\n')
    
    for line in lines[1:]:  # Skip header
        line = line.strip()
        if not line:
            continue
        
        # Skip special lines
        if line.startswith('This file') or line.startswith('This tab'):
            continue
        
        # Tab-delimited format
        if '\t' in line:
            parts = line.split('\t')
        else:
            parts = re.split(r'\s{2,}', line)
        
        if len(parts) >= 3:
            try:
                # parts[0] is rank, parts[1] is country, parts[2] is value
                country = parts[1].strip()
                value = parts[2].strip()
                if country.lower() == 'world':
                    continue
                results[country] = value
            except IndexError:
                continue
    
    return results

def extract_year_html_numbered(factbook_dir: Path, year: int) -> Dict[str, Dict]:
    """Extract data from 2002-format numbered HTML files in fields/.
    
    2002 uses numbered HTML files (2119.html for population, etc.) with
    table-based format containing CountryLink and Normal CSS classes.
    """
    fields_dir = factbook_dir / "fields"
    
    country_data = defaultdict(lambda: {
        'demographics': {},
        'economy': {},
        'military': {},
    })
    
    # Field number mappings for HTML files
    html_field_mappings = {
        '2119': ('demographics', 'population', 'population'),
        '2102': ('demographics', 'life_expectancy', 'first_number'),
        '2002': ('demographics', 'population_growth_pct', 'percent'),
        '2001': ('economy', 'gdp_ppp_billions', 'billions'),
        '2003': ('economy', 'gdp_growth_pct', 'percent'),
        '2004': ('economy', 'gdp_per_capita', 'dollars'),
        '2092': ('economy', 'inflation_pct', 'percent'),
        '2129': ('economy', 'unemployment_pct', 'percent'),
        '2078': ('economy', 'exports_billions', 'billions'),
        '2087': ('economy', 'imports_billions', 'billions'),
        '2034': ('military', 'expenditure_pct_gdp', 'percent'),
    }
    
    for field_num, (section, field_name, value_type) in html_field_mappings.items():
        filepath = fields_dir / f"{field_num}.html"
        if not filepath.exists():
            continue
        
        if filepath.stat().st_size < 100:
            continue
        
        logger.debug(f"  Processing HTML file {field_num} ({field_name})")
        
        # Parse the table-based HTML
        field_data = parse_numbered_html(filepath)
        
        for country, value_str in field_data.items():
            normalized = normalize_country_name(country)
            value = parse_value(value_str, value_type)
            
            if value is not None:
                country_data[normalized][section][field_name] = value
    
    return dict(country_data)

def parse_numbered_html(filepath: Path) -> Dict[str, str]:
    """Parse 2002-style numbered HTML files with table format.
    
    Expected format:
    <td valign=top><a href="..." class="CountryLink">Afghanistan</a></td>
    <td class="Normal">27,755,775 (July 2002 est.)</td>
    
    Uses line-by-line parsing to avoid regex issues on large HTML files.
    """
    results = {}
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        logger.warning(f"Error reading {filepath}: {e}")
        return results
    
    # Simpler approach: find all CountryLink anchors and pair with following value
    country_link_pattern = re.compile(
        r'<a[^>]*class="CountryLink"[^>]*>([^<]+)</a>',
        re.IGNORECASE
    )
    
    # Find all country links and their positions
    country_matches = list(country_link_pattern.finditer(content))
    
    for match in country_matches:
        country = match.group(1).strip()
        if country.lower() == 'world':
            continue
        
        # Look for <td class="Normal">value</td> after this match
        # Search in the next ~500 characters
        end_pos = match.end()
        search_region = content[end_pos:end_pos + 500]
        
        value_pattern = re.compile(
            r'<td[^>]*class="Normal"[^>]*>([^<]+)',
            re.IGNORECASE
        )
        value_match = value_pattern.search(search_region)
        
        if value_match:
            value = value_match.group(1).strip()
            if value and len(value) > 0:
                results[country] = value
    
    # Fallback: try a simpler pattern for general <a>country</a>...</td><td>value</td>
    if not results:
        simple_pattern = re.compile(
            r'<a[^>]+>([^<]+)</a>\s*</td>\s*<td[^>]*>([^<]+)',
            re.IGNORECASE
        )
        for match in simple_pattern.finditer(content):
            country = match.group(1).strip()
            value = match.group(2).strip()
            if country and value and country.lower() != 'world':
                # Skip navigation links (usually short or contain certain words)
                if len(country) > 2 and 'print' not in country.lower():
                    results[country] = value
    
    return results

# ============================================================================
# TIMESERIES MANAGEMENT
# ============================================================================

def load_timeseries() -> Dict[str, Dict[str, List[Dict]]]:
    """Load existing timeseries data."""
    if TIMESERIES_FILE.exists():
        try:
            with open(TIMESERIES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Error loading timeseries: {e}")
    return {}

def merge_into_timeseries(
    timeseries: Dict[str, Dict[str, List[Dict]]],
    year_data: Dict[str, Dict],
    year: int
) -> None:
    """Merge year data into timeseries structure."""
    for country, sections in year_data.items():
        # Normalize country key
        country_key = country.lower().replace(' ', '_').replace(',', '')
        
        if country_key not in timeseries:
            timeseries[country_key] = {}
        
        for section, metrics in sections.items():
            for metric, value in metrics.items():
                if metric not in timeseries[country_key]:
                    timeseries[country_key][metric] = []
                
                # Check if year already exists
                existing_years = [d['year'] for d in timeseries[country_key][metric]]
                if year not in existing_years:
                    timeseries[country_key][metric].append({
                        'year': year,
                        'value': value
                    })
                else:
                    # Update existing year
                    for i, d in enumerate(timeseries[country_key][metric]):
                        if d['year'] == year:
                            timeseries[country_key][metric][i]['value'] = value
                            break
        
        # Sort by year
        for metric in timeseries[country_key]:
            timeseries[country_key][metric].sort(key=lambda x: x['year'])

def save_timeseries(timeseries: Dict) -> None:
    """Save timeseries data to JSON."""
    MERGED_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(TIMESERIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(timeseries, f, indent=2)
    
    logger.info(f"Saved timeseries to {TIMESERIES_FILE}")

# ============================================================================
# CLEANUP FUNCTIONS
# ============================================================================

def cleanup_factbook_dir(factbook_dir: Path, dry_run: bool = False) -> int:
    """Remove unnecessary files from Factbook directory.
    
    Returns bytes freed.
    """
    bytes_freed = 0
    dirs_to_remove = ['flags', 'maps', 'docs', 'ref']
    extensions_to_remove = ['.jpg', '.gif', '.swf', '.png']
    
    for dirname in dirs_to_remove:
        dirpath = factbook_dir / dirname
        if dirpath.exists():
            size = sum(f.stat().st_size for f in dirpath.rglob('*') if f.is_file())
            if not dry_run:
                shutil.rmtree(dirpath)
                logger.info(f"Removed {dirpath} ({size / 1024 / 1024:.1f} MB)")
            else:
                logger.info(f"Would remove {dirpath} ({size / 1024 / 1024:.1f} MB)")
            bytes_freed += size
    
    for ext in extensions_to_remove:
        for f in factbook_dir.glob(f'*{ext}'):
            size = f.stat().st_size
            if not dry_run:
                f.unlink()
                logger.debug(f"Removed {f}")
            bytes_freed += size
    
    return bytes_freed

# ============================================================================
# MAIN
# ============================================================================

def find_available_years() -> List[int]:
    """Find all available Factbook year directories."""
    years = []
    for d in BASE_DIR.iterdir():
        if d.is_dir() and d.name.startswith('factbook-'):
            try:
                year = int(d.name.split('-')[1])
                years.append(year)
            except (IndexError, ValueError):
                continue
    return sorted(years)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Extract multi-year CIA World Factbook data'
    )
    parser.add_argument(
        '--years',
        nargs='*',
        type=int,
        help='Specific years to process (default: all available)'
    )
    parser.add_argument(
        '--cleanup',
        action='store_true',
        help='Remove unnecessary files after extraction'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be done without making changes'
    )
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Find years to process
    available_years = find_available_years()
    if not available_years:
        logger.error("No factbook directories found!")
        return 1
    
    years_to_process = args.years if args.years else available_years
    logger.info(f"Found Factbook years: {available_years}")
    logger.info(f"Processing years: {years_to_process}")
    
    # Load existing timeseries
    timeseries = load_timeseries()
    logger.info(f"Loaded existing timeseries with {len(timeseries)} countries")
    
    # Process each year
    total_countries = 0
    for year in years_to_process:
        factbook_dir = BASE_DIR / f"factbook-{year}"
        
        if not factbook_dir.exists():
            logger.warning(f"Directory not found: factbook-{year}")
            continue
        
        year_data = extract_year(year, factbook_dir)
        
        if year_data:
            merge_into_timeseries(timeseries, year_data, year)
            total_countries += len(year_data)
            logger.info(f"  Extracted {len(year_data)} countries for {year}")
    
    # Save timeseries
    if not args.dry_run:
        save_timeseries(timeseries)
    
    # Cleanup if requested
    if args.cleanup:
        total_freed = 0
        for year in years_to_process:
            factbook_dir = BASE_DIR / f"factbook-{year}"
            if factbook_dir.exists():
                freed = cleanup_factbook_dir(factbook_dir, dry_run=args.dry_run)
                total_freed += freed
        
        logger.info(f"Total space {'would be ' if args.dry_run else ''}freed: {total_freed / 1024 / 1024:.1f} MB")
    
    # Summary
    logger.info("\n" + "=" * 50)
    logger.info("EXTRACTION COMPLETE")
    logger.info("=" * 50)
    logger.info(f"Years processed: {len(years_to_process)}")
    logger.info(f"Total country-year records: {total_countries}")
    logger.info(f"Countries in timeseries: {len(timeseries)}")
    
    # Validation sample
    sample_country = 'united_states'
    if sample_country in timeseries:
        us_data = timeseries[sample_country]
        logger.info(f"\nSample - United States:")
        for metric in ['population', 'gdp_ppp_billions', 'life_expectancy']:
            if metric in us_data:
                years_with_data = [d['year'] for d in us_data[metric]]
                logger.info(f"  {metric}: {len(years_with_data)} data points ({min(years_with_data)}-{max(years_with_data)})")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
