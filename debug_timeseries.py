#!/usr/bin/env python3
"""Debug script to check timeseries.json data for problematic countries."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def main():
    ts_path = Path("data/_merged/timeseries.json")
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = json.load(f)
    
    countries_to_check = ["Cabo Verde", "Dominica", "United States", "Vanuatu", "Sao Tome And Principe"]
    
    for country in countries_to_check:
        print(f"\n{'='*60}")
        print(f"COUNTRY: {country}")
        print('='*60)
        
        data = ts.get(country, {})
        if not data:
            # Try with underscores
            alt_key = country.lower().replace(' ', '_')
            data = ts.get(alt_key, {})
            if data:
                print(f"  [Found with key: {alt_key}]")
        
        if not data:
            print("  NOT FOUND IN TIMESERIES")
            continue
        
        for metric, values in data.items():
            if isinstance(values, list) and values:
                print(f"\n  {metric}:")
                # Show last 3 data points
                for point in values[-3:]:
                    print(f"    {point}")
            elif isinstance(values, dict):
                print(f"\n  {metric}: {values}")
            else:
                print(f"\n  {metric}: {values}")

if __name__ == "__main__":
    main()
