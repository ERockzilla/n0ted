#!/usr/bin/env python3
"""Data verification script - checks extraction quality for key countries."""
import json
import sys
from pathlib import Path

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def main():
    # Load timeseries
    ts_path = Path("data/_merged/timeseries.json")
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = json.load(f)
    
    print("=" * 60)
    print("GEOFORECASTER DATA VERIFICATION REPORT")
    print("=" * 60)
    
    # Key countries to verify
    test_countries = [
        "Cabo Verde",
        "United States", 
        "China",
        "Germany",
        "Brazil",
        "Japan"
    ]
    
    key_metrics = ['gdp_ppp_billions', 'population', 'life_expectancy', 'gdp_per_capita']
    
    for country in test_countries:
        data = ts.get(country, {})
        if not data:
            print(f"\n[MISSING] {country}: NOT FOUND IN DATASET")
            continue
            
        print(f"\n[OK] {country}")
        for metric in key_metrics:
            metric_data = data.get(metric, {})
            if metric_data:
                years = sorted(metric_data.keys())
                year_range = f"{years[0]}-{years[-1]}"
                sample_val = metric_data.get(years[-1], "N/A")
                print(f"   {metric}: {len(years)} pts ({year_range}) | Latest: {sample_val}")
            else:
                print(f"   {metric}: [MISSING]")
    
    # Summary statistics
    print("\n" + "=" * 60)
    print("SUMMARY STATISTICS")
    print("=" * 60)
    
    total_countries = len(ts)
    has_gdp = sum(1 for c, d in ts.items() if d.get('gdp_ppp_billions'))
    has_pop = sum(1 for c, d in ts.items() if d.get('population'))
    has_life = sum(1 for c, d in ts.items() if d.get('life_expectancy'))
    
    print(f"Total countries: {total_countries}")
    print(f"With GDP PPP: {has_gdp} ({100*has_gdp/total_countries:.1f}%)")
    print(f"With Population: {has_pop} ({100*has_pop/total_countries:.1f}%)")
    print(f"With Life Expectancy: {has_life} ({100*has_life/total_countries:.1f}%)")
    
    # Countries missing key data
    print("\n" + "=" * 60)
    print("COUNTRIES MISSING GDP DATA")
    print("=" * 60)
    missing_gdp = [c for c, d in ts.items() if not d.get('gdp_ppp_billions')]
    if missing_gdp:
        for c in sorted(missing_gdp)[:15]:
            print(f"  - {c}")
        if len(missing_gdp) > 15:
            print(f"  ... and {len(missing_gdp) - 15} more")
    else:
        print("  None! All countries have GDP data.")
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
