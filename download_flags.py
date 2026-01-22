#!/usr/bin/env python3
"""
Download country flag SVGs from purecatamphetamine.github.io
and save them locally to public/flags/
"""

import os
import urllib.request
import ssl
import time

# ISO 3166-1 alpha-2 codes (same as countryFlags.ts)
COUNTRY_CODES = [
    'AF', 'AL', 'DZ', 'AS', 'AD', 'AO', 'AI', 'AG', 'AR', 'AM', 'AW', 'AU', 'AT', 'AZ',
    'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BJ', 'BM', 'BT', 'BO', 'BA', 'BW', 'BR',
    'VG', 'BN', 'BG', 'BF', 'MM', 'BI', 'CV', 'KH', 'CM', 'CA', 'KY', 'CF', 'TD', 'CL',
    'CN', 'CO', 'KM', 'CD', 'CG', 'CR', 'CI', 'HR', 'CU', 'CW', 'CY', 'CZ', 'DK', 'DJ',
    'DM', 'DO', 'TL', 'EC', 'EG', 'SV', 'GQ', 'ER', 'EE', 'SZ', 'ET', 'FO', 'FJ', 'FI',
    'FR', 'GF', 'PF', 'GA', 'GM', 'GE', 'DE', 'GH', 'GI', 'GR', 'GL', 'GD', 'GP', 'GU',
    'GT', 'GG', 'GN', 'GW', 'GY', 'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ',
    'IE', 'IM', 'IL', 'IT', 'JM', 'JP', 'JE', 'JO', 'KZ', 'KE', 'KI', 'KP', 'KR', 'XK',
    'KW', 'KG', 'LA', 'LV', 'LB', 'LS', 'LR', 'LY', 'LI', 'LT', 'LU', 'MO', 'MG', 'MW',
    'MY', 'MV', 'ML', 'MT', 'MH', 'MQ', 'MR', 'MU', 'YT', 'MX', 'FM', 'MD', 'MC', 'MN',
    'ME', 'MS', 'MA', 'MZ', 'NA', 'NR', 'NP', 'NL', 'NC', 'NZ', 'NI', 'NE', 'NG', 'MK',
    'MP', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH', 'PL', 'PT', 'PR',
    'QA', 'RE', 'RO', 'RU', 'RW', 'KN', 'LC', 'VC', 'WS', 'SM', 'ST', 'SA', 'SN', 'RS',
    'SC', 'SL', 'SG', 'SX', 'SK', 'SI', 'SB', 'SO', 'ZA', 'SS', 'ES', 'LK', 'SD', 'SR',
    'SE', 'CH', 'SY', 'TW', 'TJ', 'TZ', 'TH', 'TG', 'TO', 'TT', 'TN', 'TR', 'TM', 'TC',
    'TV', 'UG', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU', 'VA', 'VE', 'VN', 'VI', 'WF',
    'EH', 'YE', 'ZM', 'ZW'
]

def download_flags():
    """Download all flag SVGs to public/flags/"""
    
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), 'public', 'flags')
    os.makedirs(output_dir, exist_ok=True)
    
    # SSL context for HTTPS
    ctx = ssl.create_default_context()
    
    base_url = "https://purecatamphetamine.github.io/country-flag-icons/3x2"
    
    downloaded = 0
    failed = []
    
    print(f"Downloading {len(COUNTRY_CODES)} flag SVGs to {output_dir}...")
    print()
    
    for code in COUNTRY_CODES:
        url = f"{base_url}/{code}.svg"
        output_path = os.path.join(output_dir, f"{code}.svg")
        
        # Skip if already exists
        if os.path.exists(output_path):
            print(f"  [SKIP] {code}.svg (already exists)")
            downloaded += 1
            continue
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                svg_content = response.read()
                
            with open(output_path, 'wb') as f:
                f.write(svg_content)
            
            print(f"  [OK] {code}.svg")
            downloaded += 1
            
            # Small delay to be nice to the server
            time.sleep(0.1)
            
        except Exception as e:
            print(f"  [FAIL] {code}.svg - {e}")
            failed.append(code)
    
    print()
    print(f"Done! Downloaded {downloaded}/{len(COUNTRY_CODES)} flags.")
    
    if failed:
        print(f"Failed: {', '.join(failed)}")
    
    return len(failed) == 0

if __name__ == '__main__':
    success = download_flags()
    exit(0 if success else 1)
