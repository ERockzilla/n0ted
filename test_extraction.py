#!/usr/bin/env python3
"""Test script to verify extraction for specific countries."""
import sys
import logging

# Suppress logging to stdout
logging.getLogger().setLevel(logging.CRITICAL)

from extract_all_years import extract_year, detect_factbook_version
from pathlib import Path

factbook_dir = Path('factbook-2020')
version = detect_factbook_version(factbook_dir)
print(f'Detected version for 2020: {version}')

data = extract_year(2020, factbook_dir)
print(f'Total countries extracted: {len(data)}')

# Check Cabo Verde
cv = data.get('Cabo Verde', {})
print(f'\nCabo Verde data:')
print(f'  economy: {cv.get("economy", {})}')
print(f'  demographics: {cv.get("demographics", {})}')

# Check United States  
us = data.get('United States', {})
print(f'\nUnited States data:')
print(f'  economy: {us.get("economy", {})}')
print(f'  demographics: {us.get("demographics", {})}')

# Check if GDP PPP exists for any country
gdp_count = sum(1 for c in data.values() if c.get('economy', {}).get('gdp_ppp_billions'))
print(f'\nCountries with GDP PPP data: {gdp_count}')
