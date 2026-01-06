import pandas as pd
import requests
import io
import json
import os
import numpy as np

# --- SOURCES ---
# 1. ENERGY & CO2 (From OWID - Fast & Scientific)
ENERGY_URL = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
CO2_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

# 2. WEALTH (From World Bank API - Reliable Financials)
# API Format: http://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=10000&date=2000:2025

OUTPUT_FILE = 'public/global_data.json'

def fetch_csv(url):
    print(f"📥 Downloading CSV: {url}...")
    try:
        r = requests.get(url)
        return pd.read_csv(io.StringIO(r.content.decode('utf-8')))
    except Exception as e:
        print(f"❌ Error: {e}")
        return pd.DataFrame()

def fetch_world_bank_gdp():
    print("🏦 Fetching GDP from World Bank...")
    url = "http://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=15000&date=2000:2025"
    try:
        r = requests.get(url)
        data = r.json()
        if len(data) < 2: return {}
        
        # Convert list to dictionary: { 'USA': { '2022': 76000, '2023': ... } }
        gdp_map = {}
        for entry in data[1]:
            iso = entry.get('countryiso3code', '')
            if not iso: continue
            
            val = entry.get('value')
            year = entry.get('date')
            
            if iso not in gdp_map: gdp_map[iso] = {}
            if val is not None: gdp_map[iso][year] = val
            
        return gdp_map
    except Exception as e:
        print(f"❌ World Bank Error: {e}")
        return {}

def main():
    print("--- 🚀 STARTING HYBRID CRAWLER ---")

    # 1. GET DATA
    df_energy = fetch_csv(ENERGY_URL)
    df_co2 = fetch_csv(CO2_URL)
    gdp_data = fetch_world_bank_gdp()

    # 2. FILTER & PROCESS
    master_data = {}

    # Process Energy (OWID)
    if not df_energy.empty:
        df_energy = df_energy[(df_energy['year'] >= 2000) & (df_energy['iso_code'].notna())]
        for _, row in df_energy.iterrows():
            iso = row['iso_code']
            if len(str(iso)) > 3: continue # Skip regions
            
            if iso not in master_data:
                master_data[iso] = {'iso_code': iso, 'country': row.get('country', iso), 'energy': [], 'gdp': [], 'co2': []}
            
            val = row.get('per_capita_electricity', 0)
            if pd.notna(val) and val > 0:
                master_data[iso]['energy'].append({'date': str(int(row['year'])), 'value': float(val)})

    # Process CO2 (OWID)
    if not df_co2.empty:
        df_co2 = df_co2[(df_co2['year'] >= 2000) & (df_co2['iso_code'].notna())]
        for _, row in df_co2.iterrows():
            iso = row['iso_code']
            if iso in master_data:
                val = row.get('co2_per_capita', 0)
                if pd.notna(val) and val > 0:
                    master_data[iso]['co2'].append({'date': str(int(row['year'])), 'value': float(val)})

    # Process GDP (World Bank Injection)
    print("🔗 Injecting Wealth Data...")
    for iso, history in gdp_data.items():
        if iso in master_data:
            for year, value in history.items():
                master_data[iso]['gdp'].append({'date': str(year), 'value': float(value)})

    # 3. SAVE
    final_output = [v for k, v in master_data.items() if v['energy'] or v['gdp']]
    
    os.makedirs('public', exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=0)

    print(f"--- ✅ HYBRID UPDATE COMPLETE: {len(final_output)} Countries ---")

if __name__ == "__main__":
    main()
