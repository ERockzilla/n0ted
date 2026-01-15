#!/usr/bin/env python3
"""
Merge Timeseries Data

Combines multiple years of extracted Factbook data into time-series
format for trend analysis.

Usage:
    python merge_timeseries.py

Outputs:
    data/_merged/timeseries.json
    data/_merged/changes.json
"""

import json
import os
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path('data')
OUTPUT_DIR = DATA_DIR / '_merged'

# Metrics to track over time
TRACKED_METRICS = {
    'demographics': ['population', 'population_growth_pct', 'life_expectancy', 'median_age'],
    'economy': ['gdp_ppp_billions', 'gdp_growth_pct', 'gdp_per_capita', 'inflation_pct', 
                'unemployment_pct', 'exports_billions', 'imports_billions', 'external_debt_billions'],
    'military': ['expenditure_pct_gdp'],
}

# Alert thresholds for significant changes
ALERT_THRESHOLDS = {
    'gdp_ppp_billions': {'change_pct': 20, 'direction': 'any'},
    'gdp_growth_pct': {'change_abs': 5, 'direction': 'any'},
    'population': {'change_pct': -5, 'direction': 'decrease'},
    'unemployment_pct': {'change_abs': 5, 'direction': 'increase'},
    'inflation_pct': {'change_abs': 10, 'direction': 'increase'},
    'expenditure_pct_gdp': {'change_pct': 50, 'direction': 'increase'},
}


def get_available_years() -> list[int]:
    """Find all year directories in data folder."""
    years = []
    for item in DATA_DIR.iterdir():
        if item.is_dir() and item.name.isdigit():
            years.append(int(item.name))
    return sorted(years)


def load_all_countries(year: int) -> dict:
    """Load all countries for a given year."""
    year_dir = DATA_DIR / str(year)
    countries = {}
    
    for filepath in year_dir.glob('*.json'):
        if filepath.name == '_index.json':
            continue
        try:
            with open(filepath) as f:
                data = json.load(f)
                # Use lowercase name as key for matching
                key = data['country'].lower().replace(' ', '_')
                countries[key] = data
        except Exception as e:
            print(f"  Warning: Could not load {filepath}: {e}")
    
    return countries


def extract_metrics(country_data: dict) -> dict:
    """Extract tracked metrics from country data."""
    metrics = {}
    for section, fields in TRACKED_METRICS.items():
        section_data = country_data.get(section, {})
        for field in fields:
            if field in section_data and section_data[field] is not None:
                metrics[field] = section_data[field]
    return metrics


def calculate_change(old_val: float, new_val: float) -> dict:
    """Calculate absolute and percentage change."""
    if old_val is None or new_val is None:
        return None
    
    abs_change = new_val - old_val
    pct_change = ((new_val - old_val) / abs(old_val) * 100) if old_val != 0 else None
    
    return {
        'old': old_val,
        'new': new_val,
        'abs_change': round(abs_change, 2),
        'pct_change': round(pct_change, 2) if pct_change else None
    }


def check_alerts(metric: str, change: dict) -> list[str]:
    """Check if change triggers any alerts."""
    if not change or metric not in ALERT_THRESHOLDS:
        return []
    
    threshold = ALERT_THRESHOLDS[metric]
    alerts = []
    
    if 'change_pct' in threshold and change['pct_change']:
        target = threshold['change_pct']
        direction = threshold['direction']
        
        if direction == 'any' and abs(change['pct_change']) >= abs(target):
            alerts.append(f"{metric}_major_change")
        elif direction == 'increase' and change['pct_change'] >= target:
            alerts.append(f"{metric}_spike")
        elif direction == 'decrease' and change['pct_change'] <= target:
            alerts.append(f"{metric}_decline")
    
    if 'change_abs' in threshold:
        target = threshold['change_abs']
        direction = threshold['direction']
        
        if direction == 'increase' and change['abs_change'] >= target:
            alerts.append(f"{metric}_spike")
        elif direction == 'decrease' and change['abs_change'] <= -target:
            alerts.append(f"{metric}_decline")
    
    return alerts


def main():
    years = get_available_years()
    print(f"Found {len(years)} years of data: {years}")
    
    if len(years) < 1:
        print("Error: No data years found in data/ directory")
        return 1
    
    # Load all data
    all_data = {}
    for year in years:
        print(f"Loading {year}...")
        all_data[year] = load_all_countries(year)
        print(f"  Loaded {len(all_data[year])} countries")
    
    # Build timeseries
    timeseries = defaultdict(lambda: defaultdict(list))
    all_countries = set()
    
    for year in years:
        for country_key, country_data in all_data[year].items():
            all_countries.add(country_key)
            metrics = extract_metrics(country_data)
            
            for metric, value in metrics.items():
                timeseries[country_key][metric].append({
                    'year': year,
                    'value': value
                })
    
    # Calculate changes between consecutive years
    changes = defaultdict(dict)
    
    for i in range(1, len(years)):
        prev_year = years[i-1]
        curr_year = years[i]
        period = f"{prev_year}_to_{curr_year}"
        
        for country_key in all_countries:
            prev_data = all_data[prev_year].get(country_key, {})
            curr_data = all_data[curr_year].get(country_key, {})
            
            if not prev_data or not curr_data:
                continue
            
            prev_metrics = extract_metrics(prev_data)
            curr_metrics = extract_metrics(curr_data)
            
            country_changes = {}
            country_alerts = []
            
            for metric in set(prev_metrics.keys()) | set(curr_metrics.keys()):
                change = calculate_change(
                    prev_metrics.get(metric),
                    curr_metrics.get(metric)
                )
                if change:
                    country_changes[metric] = change
                    country_alerts.extend(check_alerts(metric, change))
            
            if country_changes:
                changes[country_key][period] = {
                    'metrics': country_changes,
                    'alerts': country_alerts
                }
    
    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save timeseries
    timeseries_path = OUTPUT_DIR / 'timeseries.json'
    with open(timeseries_path, 'w') as f:
        json.dump(dict(timeseries), f, indent=2)
    print(f"\nSaved timeseries to {timeseries_path}")
    
    # Save changes
    changes_path = OUTPUT_DIR / 'changes.json'
    with open(changes_path, 'w') as f:
        json.dump(dict(changes), f, indent=2)
    print(f"Saved changes to {changes_path}")
    
    # Summary
    print(f"\n=== Summary ===")
    print(f"Countries tracked: {len(all_countries)}")
    print(f"Years covered: {years}")
    
    if len(years) > 1:
        # Find countries with most alerts
        alert_counts = []
        for country_key, periods in changes.items():
            total_alerts = sum(len(p.get('alerts', [])) for p in periods.values())
            if total_alerts > 0:
                alert_counts.append((country_key, total_alerts))
        
        alert_counts.sort(key=lambda x: -x[1])
        
        if alert_counts:
            print(f"\nTop countries with significant changes:")
            for country, count in alert_counts[:10]:
                print(f"  {country}: {count} alerts")
    
    return 0


if __name__ == '__main__':
    exit(main())
