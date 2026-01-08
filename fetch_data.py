import pandas as pd
import requests
import io
import json
import os
import time
from datetime import datetime

OUTPUT_FILE = 'public/global_data.json'
TEMP_FILE = 'public/global_data.tmp.json'

OWID_ENERGY = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
OWID_CO2 = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
WB_INDICATORS = {
    'gdp': 'NY.GDP.PCAP.CD', 'water': 'SH.H2O.BASW.ZS', 'internet': 'IT.NET.USER.ZS',
    'life': 'SP.DYN.LE00.IN', 'inflation': 'FP.CPI.TOTL.ZG'
}

def fetch_csv(url):
    print(f"Fetching {url}...")
    try:
        r = requests.get(url)
        return pd.read_csv(io.StringIO(r.content.decode('utf-8')))
    except Exception as e:
        print(f"Error fetching CSV: {e}")
        return pd.DataFrame()

def fetch_wb_data(indicator_code):
    print(f"Fetching WB Indicator: {indicator_code}...")
    url = f"http://api.worldbank.org/v2/country/all/indicator/{indicator_code}?format=json&per_page=15000&date=2000:2025"
    try:
        r = requests.get(url)
        data = r.json()
        if len(data) < 2: return {}
        data_map = {}
        for entry in data[1]:
            iso = entry.get('countryiso3code', '')
            val = entry.get('value')
            year = entry.get('date')
            if not iso or val is None: continue
            if iso not in data_map: data_map[iso] = {}
            data_map[iso][year] = float(val)
        return data_map
    except Exception as e:
        print(f"Error fetching WB data: {e}")
        return {}

def main():
    master_data = {}
    
    # 1. Fetch CSVs
    df_energy = fetch_csv(OWID_ENERGY)
    df_co2 = fetch_csv(OWID_CO2)

    # 2. Process Energy
    if not df_energy.empty:
        df_energy = df_energy[(df_energy['year'] >= 2000) & (df_energy['iso_code'].notna())]
        for _, row in df_energy.iterrows():
            iso = row['iso_code']
            if len(str(iso)) > 3: continue
            if iso not in master_data: master_data[iso] = {'iso_code': iso, 'country': row.get('country', iso)}
            
            val_e = row.get('per_capita_electricity', 0)
            if pd.notna(val_e) and val_e > 0: 
                master_data[iso].setdefault('energy', []).append({'date': str(int(row['year'])), 'value': val_e})
            
            val_r = row.get('renewables_share_energy', 0)
            if pd.notna(val_r) and val_r >= 0: 
                master_data[iso].setdefault('renewables', []).append({'date': str(int(row['year'])), 'value': val_r})

    # 3. Process CO2
    if not df_co2.empty:
        df_co2 = df_co2[(df_co2['year'] >= 2000) & (df_co2['iso_code'].notna())]
        for _, row in df_co2.iterrows():
            iso = row['iso_code']
            if len(str(iso)) > 3: continue
            if iso not in master_data: continue # Only add CO2 if country exists
            
            val_c = row.get('co2_per_capita', 0)
            if pd.notna(val_c) and val_c > 0: 
                master_data[iso].setdefault('co2', []).append({'date': str(int(row['year'])), 'value': val_c})

    # 4. Process World Bank
    for key, code in WB_INDICATORS.items():
        wb_data = fetch_wb_data(code)
        for iso, history in wb_data.items():
            if iso not in master_data: master_data[iso] = {'iso_code': iso, 'country': iso}
            formatted_list = [{'date': str(y), 'value': v} for y, v in history.items()]
            formatted_list.sort(key=lambda x: int(x['date']))
            master_data[iso][key] = formatted_list

    # 5. Format Output
    countries_list = [v for k, v in master_data.items()]
    final_output = {
        "meta": {
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "count": len(countries_list)
        },
        "data": countries_list
    }

    # 6. Atomic Write
    os.makedirs('public', exist_ok=True)
    with open(TEMP_FILE, 'w') as f:
        json.dump(final_output, f, indent=0)
    
    os.replace(TEMP_FILE, OUTPUT_FILE)
    print(f"Success! Data saved to {OUTPUT_FILE} with {len(countries_list)} countries.")

if __name__ == "__main__":
    main()
    
