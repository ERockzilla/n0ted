#!/usr/bin/env python3
"""Copy region data from 2010 to 2020 country files."""
import json
from pathlib import Path

def main():
    data_dir = Path('data')
    dir_2010 = data_dir / '2010'
    dir_2020 = data_dir / '2020'
    
    updated = 0
    for f2020 in dir_2020.glob('*.json'):
        if f2020.name.startswith('_'):
            continue
        f2010 = dir_2010 / f2020.name
        if f2010.exists():
            try:
                with open(f2010, encoding='utf-8') as f:
                    data_2010 = json.load(f)
                with open(f2020, encoding='utf-8') as f:
                    data_2020 = json.load(f)
                
                if data_2010.get('region') and not data_2020.get('region'):
                    data_2020['region'] = data_2010['region']
                    with open(f2020, 'w', encoding='utf-8') as f:
                        json.dump(data_2020, f, indent=2)
                    updated += 1
                    print(f"Updated: {f2020.name} -> {data_2010['region']}")
            except Exception as e:
                print(f'Error with {f2020.name}: {e}')
    
    print(f'\nTotal: Updated region data for {updated} countries in 2020 folder')

if __name__ == '__main__':
    main()
