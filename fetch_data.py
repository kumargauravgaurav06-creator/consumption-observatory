import pandas as pd
import requests
import io
import json
import os
import numpy as np

# --- CONFIGURATION ---
OUTPUT_FILE = 'public/global_data.json'

# 1. OWID SOURCES (Fast & Scientific)
OWID_ENERGY = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
OWID_CO2 = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

# 2. WORLD BANK SOURCES (Reliable Social Data)
# Format: { 'Internal_Key': 'World_Bank_Code' }
WB_INDICATORS = {
    'gdp': 'NY.GDP.PCAP.CD',        # GDP per capita
    'water': 'SH.H2O.BASW.ZS',      # Access to basic drinking water (% of pop)
    'internet': 'IT.NET.USER.ZS',   # Internet users (% of pop)
    'life': 'SP.DYN.LE00.IN',       # Life expectancy
    'inflation': 'FP.CPI.TOTL.ZG'   # Inflation (annual %)
}

def fetch_csv(url):
    print(f"📥 Downloading CSV: {url}...")
    try:
        r = requests.get(url)
        return pd.read_csv(io.StringIO(r.content.decode('utf-8')))
    except Exception as e:
        print(f"❌ Error: {e}")
        return pd.DataFrame()

def fetch_wb_data(indicator_code):
    print(f"🏦 Fetching WB Code: {indicator_code}...")
    url = f"http://api.worldbank.org/v2/country/all/indicator/{indicator_code}?format=json&per_page=15000&date=2000:2025"
    try:
        r = requests.get(url)
        data = r.json()
        if len(data) < 2: return {}
        
        # Map: { 'USA': { '2022': 55.4 } }
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
        print(f"❌ WB Error: {e}")
        return {}

def main():
    print("--- 🚀 STARTING MEGA-CRAWLER ---")
    master_data = {}

    # A. PROCESS OWID (Energy, Renewables, CO2)
    df_energy = fetch_csv(OWID_ENERGY)
    df_co2 = fetch_csv(OWID_CO2)

    if not df_energy.empty:
        df_energy = df_energy[(df_energy['year'] >= 2000) & (df_energy['iso_code'].notna())]
        for _, row in df_energy.iterrows():
            iso = row['iso_code']
            if len(str(iso)) > 3: continue
            
            if iso not in master_data:
                master_data[iso] = {'iso_code': iso, 'country': row.get('country', iso)}

            # 1. Energy
            val_e = row.get('per_capita_electricity', 0)
            if pd.notna(val_e) and val_e > 0:
                master_data[iso].setdefault('energy', []).append({'date': str(int(row['year'])), 'value': val_e})

            # 2. Renewables (% share)
            val_r = row.get('renewables_share_energy', 0)
            if pd.notna(val_r) and val_r >= 0:
                master_data[iso].setdefault('renewables', []).append({'date': str(int(row['year'])), 'value': val_r})

    if not df_co2.empty:
        df_co2 = df_co2[(df_co2['year'] >= 2000) & (df_co2['iso_code'].notna())]
        for _, row in df_co2.iterrows():
            iso = row['iso_code']
            if len(str(iso)) > 3: continue
            if iso not in master_data: continue

            # 3. CO2
            val_c = row.get('co2_per_capita', 0)
            if pd.notna(val_c) and val_c > 0:
                master_data[iso].setdefault('co2', []).append({'date': str(int(row['year'])), 'value': val_c})

    # B. PROCESS WORLD BANK (Wealth, Water, Internet, Life, Inflation)
    for key, code in WB_INDICATORS.items():
        wb_data = fetch_wb_data(code)
        
        for iso, history in wb_data.items():
            if iso not in master_data:
                 # Initialize if only found in WB (rare but possible)
                 master_data[iso] = {'iso_code': iso, 'country': iso}
            
            # Convert dictionary history to list format
            formatted_list = [{'date': str(y), 'value': v} for y, v in history.items()]
            formatted_list.sort(key=lambda x: int(x['date']))
            master_data[iso][key] = formatted_list

    # C. SAVE
    final_output = [v for k, v in master_data.items()]
    
    os.makedirs('public', exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=0)

    print(f"--- ✅ EXPANSION COMPLETE: {len(final_output)} Countries ---")

if __name__ == "__main__":
    main()
