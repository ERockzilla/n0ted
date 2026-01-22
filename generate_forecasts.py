import json
import os
import sys
import numpy as np
from scipy import stats

# Configuration
INPUT_FILE = os.path.join('data', '_merged', 'timeseries.json')
OUTPUT_DIR = os.path.join('data', '_forecasts')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'forecasts.json')
TARGET_YEARS = [2025, 2030]

# Metrics to forecast
METRICS = [
    ('demographics', 'population'),
    ('demographics', 'life_expectancy'),
    ('demographics', 'median_age'),
    ('economy', 'gdp_ppp_billions'),
    ('economy', 'gdp_per_capita'),
    ('military', 'expenditure_pct_gdp')
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def linear_regression_forecast(points, target_year):
    """
    Use scipy.stats.linregress for proper OLS linear regression.
    Returns: dict with prediction, confidence intervals, and stats
    """
    points.sort(key=lambda x: x[0])
    
    x = np.array([p[0] for p in points], dtype=float)
    y = np.array([p[1] for p in points], dtype=float)
    
    if len(points) < 2:
        return None
    
    try:
        # Perform OLS Linear Regression
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        r_squared = r_value ** 2
        
        # Predict
        prediction = intercept + slope * target_year
        
        # Calculate Prediction Interval (95%)
        n = len(x)
        x_mean = np.mean(x)
        sum_sq_x = np.sum((x - x_mean) ** 2)
        
        # Standard Error of the Regression (Residual Standard Error)
        y_pred = intercept + slope * x
        residuals = y - y_pred
        dof = n - 2  # degrees of freedom
        
        if dof > 0:
            s_res = np.sqrt(np.sum(residuals ** 2) / dof)
        else:
            s_res = std_err  # Fallback to linregress std_err
        
        # Prediction interval margin
        # PI = t * s * sqrt(1 + 1/n + (x0 - x_mean)^2 / sum_sq_x)
        t_value = 1.96  # Approx 95% for large n
        if sum_sq_x > 0:
            pi_margin = t_value * s_res * np.sqrt(1 + (1/n) + ((target_year - x_mean)**2 / sum_sq_x))
        else:
            pi_margin = t_value * s_res  # Fallback
        
        # Volatility (Coefficient of Variation)
        volatility = np.std(y) / np.abs(np.mean(y)) if np.mean(y) != 0 else 0.0
        
        return {
            "value": float(prediction),
            "ci_low": float(prediction - pi_margin),
            "ci_high": float(prediction + pi_margin),
            "r_squared": float(r_squared),
            "slope": float(slope),
            "p_value": float(p_value),
            "volatility": float(volatility),
            "method": "Linear Regression (OLS)"
        }

    except Exception as e:
        print(f"Regression error: {e}")
        return None

def main():
    print(f"Loading data from {INPUT_FILE}...")
    try:
        with open(INPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found.")
        sys.exit(1)
        
    forecasts = {}
    
    print(f"Generating Linear Regression forecasts for {len(data)} countries...")
    
    for country_key, country_data in data.items():
        forecasts[country_key] = {}
        
        for category, metric in METRICS:
            if category not in forecasts[country_key]:
                forecasts[country_key][category] = {}
                
            # Extract historical points
            points = []
            metric_data_list = country_data.get(metric, [])
            
            for entry in metric_data_list:
                if isinstance(entry, dict) and 'year' in entry and 'value' in entry:
                    try:
                        val = float(entry['value'])
                        points.append((int(entry['year']), val))
                    except (ValueError, TypeError):
                        continue
            
            # De-duplicate years
            points_dict = {p[0]: p[1] for p in points}
            points = sorted([(k, v) for k, v in points_dict.items()])
            
            if len(points) >= 2:
                metric_forecast = {
                    "historical": [{"year": y, "value": v} for y, v in points],
                    "forecast": []
                }
                
                for target_year in TARGET_YEARS:
                    result = linear_regression_forecast(points, target_year)
                    if result:
                        metric_forecast["forecast"].append({
                            "year": target_year,
                            **result
                        })
                
                # Sanity Checks: Non-negative values
                for f in metric_forecast["forecast"]:
                    if metric in ['population', 'life_expectancy', 'median_age', 'gdp_ppp_billions', 'gdp_per_capita']:
                         f['value'] = max(0, f['value'])
                         f['ci_low'] = max(0, f['ci_low'])
                
                forecasts[country_key][category][metric] = metric_forecast

    # Clean up empty entries
    final_forecasts = {}
    for c, cats in forecasts.items():
        non_empty_cats = {}
        for cat_name, metrics in cats.items():
             valid_metrics = {k: v for k, v in metrics.items() if v.get("forecast")}
             if valid_metrics:
                 non_empty_cats[cat_name] = valid_metrics
        if non_empty_cats:
            final_forecasts[c] = non_empty_cats

    ensure_dir(OUTPUT_DIR)
    print(f"Saving forecasts to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_forecasts, f, indent=2)
        
    print("Done.")

if __name__ == "__main__":
    main()
