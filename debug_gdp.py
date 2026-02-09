#!/usr/bin/env python3
"""Debug script to check GDP PPP values in timeseries.json."""
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def main():
    ts_path = Path("data/_merged/timeseries.json")
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = json.load(f)
    
    print("GDP PPP Billions - Sample Countries")
    print("="*60)
    
    # Check specific countries
    targets = {
        "Cabo Verde": 3.8,  # Real GDP ~$3.8B
        "Dominica": 0.5,    # Real GDP ~$0.5B 
        "Vanuatu": 0.8,     # Real GDP ~$0.8B
        "Sao Tome And Principe": 0.7,  # Real GDP ~$0.7B
        "United States": 21000,  # Real GDP ~$21T
        "China": 25000,     # Real GDP ~$25T
    }
    
    for country, expected in targets.items():
        data = ts.get(country, {})
        if not data:
            # Try underscore version
            alt = country.lower().replace(' ', '_')
            data = ts.get(alt, {})
            if data:
                country = alt
        
        gdp_data = data.get('gdp_ppp_billions', [])
        
        if gdp_data and isinstance(gdp_data, list):
            # Get 2020 value
            val_2020 = None
            for pt in gdp_data:
                if pt.get('year') == 2020:
                    val_2020 = pt.get('value')
                    break
            
            # Get latest value
            latest = gdp_data[-1] if gdp_data else {}
            latest_val = latest.get('value')
            latest_year = latest.get('year')
            
            status = "OK" if (latest_val and abs(latest_val - expected) / expected < 0.5) else "BAD"
            print(f"{status:4} {country:30} Expected: ${expected}B, Got: ${latest_val} ({latest_year})")
        else:
            print(f"MISS {country:30} No GDP data found")
    
    print("\n" + "="*60)
    print("Countries with largest GDP values (checking for unit errors)")
    print("="*60)
    
    # Find all countries with huge GDP values (potential unit errors)
    suspicious = []
    for country, data in ts.items():
        gdp_data = data.get('gdp_ppp_billions', [])
        if gdp_data and isinstance(gdp_data, list):
            for pt in gdp_data:
                val = pt.get('value', 0)
                if val and val > 1000:  # > $1 trillion
                    suspicious.append((country, pt.get('year'), val))
    
    suspicious.sort(key=lambda x: x[2], reverse=True)
    print(f"\nFound {len(suspicious)} entries with GDP > $1000B (suspicious for small countries):\n")
    for c, y, v in suspicious[:20]:
        print(f"  {c}: {y} = ${v}B")

if __name__ == "__main__":
    main()
