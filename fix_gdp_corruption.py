#!/usr/bin/env python3
"""
Fix corrupted GDP data in timeseries.json across ALL years

The issue: Some GDP values are orders of magnitude too large for small economies.
For example, Cabo Verde showing $14992B when it should be ~$3B.

This script:
1. Loads timeseries.json
2. For each country, checks if gdp_ppp_billions values are reasonable
3. Removes all obviously wrong values (small economy with GDP > $2T)
4. Saves corrected timeseries.json
"""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Countries whose GDP can be > 1000 billion (major economies)
MAJOR_ECONOMIES = {
    'united_states', 'china', 'european_union', 'japan', 'germany', 
    'united_kingdom', 'india', 'france', 'brazil', 'italy', 
    'canada', 'russia', 'south_korea', 'australia', 'spain',
    'mexico', 'indonesia', 'netherlands', 'saudi_arabia', 'turkey',
    'world'  # aggregate
}

def main():
    ts_path = Path("data/_merged/timeseries.json")
    
    print("="*60)
    print("GDP DATA CORRECTION - ALL YEARS")
    print("="*60)
    
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = json.load(f)
    
    corrections = 0
    
    for country_key, data in ts.items():
        gdp_data = data.get('gdp_ppp_billions', [])
        if not gdp_data or not isinstance(gdp_data, list):
            continue
        
        # Check if this is a major economy
        is_major = country_key.lower() in MAJOR_ECONOMIES
        
        # Threshold for maximum GDP
        # Major economies: $35T (China peak)
        # Others: $1.5T max (Turkey, Indonesia-ish)
        max_gdp = 35000 if is_major else 1500
        
        # Filter out bad values
        new_gdp_data = []
        for point in gdp_data:
            val = point.get('value', 0)
            year = point.get('year', 0)
            
            if val and val > max_gdp:
                print(f"REMOVING {country_key} {year}: ${val}B (too large)")
                corrections += 1
            else:
                new_gdp_data.append(point)
        
        # Update the data
        if len(new_gdp_data) != len(gdp_data):
            data['gdp_ppp_billions'] = new_gdp_data
    
    print(f"\nTotal corrections: {corrections}")
    
    if corrections > 0:
        # Save corrected timeseries
        with open(ts_path, 'w', encoding='utf-8') as f:
            json.dump(ts, f, indent=2)
        print(f"Saved corrected timeseries to {ts_path}")
    else:
        print("No corrections needed!")
    
    return corrections

if __name__ == "__main__":
    corrections = main()
    sys.exit(0 if corrections >= 0 else 1)
