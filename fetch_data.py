import pandas as pd
import requests
import io
import json
import os
import numpy as np

# --- SOURCES ---
# OWID Energy (Fastest for Electricity)
ENERGY_URL = "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
# OWID CO2 (Fastest for Emissions)
CO2_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

# SAVE PATH
OUTPUT_FILE = 'public/global_data.json'

def fetch_csv_as_dataframe(url):
    print(f"📥 Downloading data from: {url}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        return pd.read_csv(io.StringIO(response.content.decode('utf-8')))
    except Exception as e:
        print(f"❌ Error fetching {url}: {e}")
        return pd.DataFrame()

def main():
    print("--- 🚀 STARTING SUPER-CRAWLER (OWID ENGINE) ---")

    # 1. FETCH RAW DATA
    df_energy = fetch_csv_as_dataframe(ENERGY_URL)
    df_co2 = fetch_csv_as_dataframe(CO2_URL)

    if df_energy.empty or df_co2.empty:
        print("CRITICAL FAILURE: Could not download raw data.")
        return

    # 2. FILTER RECENT HISTORY (2000 - 2025)
    # We only want countries (iso_code is not null) and recent years
    # "OWID_WRL" is the code for the whole world, we can exclude aggregates if we want only countries
    # But usually iso_code is 3 letters for countries.
    
    if 'iso_code' in df_energy.columns:
        df_energy = df_energy[(df_energy['year'] >= 2000) & (df_energy['iso_code'].notna())]
    
    if 'iso_code' in df_co2.columns:
        df_co2 = df_co2[(df_co2['year'] >= 2000) & (df_co2['iso_code'].notna())]

    # 3. BUILD THE MASTER DICTIONARY
    master_data = {}

    print("⚙️ Processing Energy Data...")
    for _, row in df_energy.iterrows():
        iso = row['iso_code']
        year = int(row['year'])
        
        # SKIP REGIONAL AGGREGATES (Like "Europe", "Africa") which usually lack valid ISOs or have special OWID_ codes
        if len(str(iso)) > 3: continue 

        # Metrics:
        # Electricity per capita (kWh)
        val_energy = row.get('per_capita_electricity', 0)
        # GDP per capita
        val_gdp = row.get('gdp_per_capita', 0)

        if iso not in master_data:
            master_data[iso] = {'iso_code': iso, 'country': row.get('country', iso), 'energy': [], 'gdp': [], 'co2': []}
        
        # Clean NaN values
        if pd.notna(val_energy) and val_energy > 0:
            master_data[iso]['energy'].append({'date': str(year), 'value': float(val_energy)})
            
        if pd.notna(val_gdp) and val_gdp > 0:
            master_data[iso]['gdp'].append({'date': str(year), 'value': float(val_gdp)})

    print("⚙️ Processing CO2 Data...")
    for _, row in df_co2.iterrows():
        iso = row['iso_code']
        year = int(row['year'])
        
        if len(str(iso)) > 3: continue

        val_co2 = row.get('co2_per_capita', 0)

        if iso not in master_data:
             continue 

        if pd.notna(val_co2) and val_co2 > 0:
            master_data[iso]['co2'].append({'date': str(year), 'value': float(val_co2)})

    # 4. FORMAT FOR JSON
    final_output = []
    for iso, data in master_data.items():
        # Sort by date
        data['energy'].sort(key=lambda x: int(x['date']))
        data['gdp'].sort(key=lambda x: int(x['date']))
        data['co2'].sort(key=lambda x: int(x['date']))
        
        # Only save if we have at least SOME data
        if data['energy'] or data['co2'] or data['gdp']:
            final_output.append(data)

    # 5. SAVE TO DISK
    os.makedirs('public', exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=0)

    print(f"--- ✅ SUCCESS: Extracted data for {len(final_output)} countries. ---")
    print(f"Target: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
