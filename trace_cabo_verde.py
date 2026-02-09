#!/usr/bin/env python3
"""Trace Cabo Verde data through the extraction pipeline."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def main():
    # Check timeseries for exact structure
    ts_path = Path("data/_merged/timeseries.json")
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = json.load(f)
    
    print("="*60)
    print("TIMESERIES.JSON STRUCTURE FOR CABO VERDE")
    print("="*60)
    
    # Find Cabo Verde by various keys
    keys_to_try = ["Cabo Verde", "cabo_verde", "Cape Verde", "cape_verde"]
    cv_data = None
    cv_key = None
    for k in keys_to_try:
        if k in ts:
            cv_data = ts[k]
            cv_key = k
            break
    
    if cv_data:
        print(f"Found with key: {cv_key}")
        gdp = cv_data.get('gdp_ppp_billions', [])
        print(f"\nGDP PPP data ({len(gdp)} points):")
        for pt in gdp:
            print(f"  {pt}")
    else:
        print("Cabo Verde NOT FOUND in timeseries!")
        print(f"Available keys (sample): {list(ts.keys())[:20]}")
    
    # Check per-year JSON
    print("\n" + "="*60)
    print("PER-YEAR JSON: data/2020/cabo_verde.json")
    print("="*60)
    
    year_file = Path("data/2020/cabo_verde.json")
    if year_file.exists():
        with open(year_file, 'r', encoding='utf-8') as f:
            year_data = json.load(f)
        print(json.dumps(year_data['economy'], indent=2))
    else:
        print("File not found!")
    
    # Compare with United States
    print("\n" + "="*60)
    print("COMPARISON: United States 2020")
    print("="*60)
    us_file = Path("data/2020/united_states.json")
    if us_file.exists():
        with open(us_file, 'r', encoding='utf-8') as f:
            us_data = json.load(f)
        print(json.dumps(us_data['economy'], indent=2))

if __name__ == "__main__":
    main()
