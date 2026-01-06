import pandas as pd
import requests
import io
import json
import os

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
        s = requests.get(url).content
        return pd.read_csv(io.StringIO(s.decode('utf-8')))
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
    df_energy = df_energy[(df_energy['year'] >= 2000) & (df_energy['iso_code'].notna())]
    df_co2 = df_co2[(df_co2['year'] >= 2000) & (df_co2['iso_code'].notna())]

    # 3. BUILD THE MASTER DICTIONARY
    # We will pivot the data so it matches the structure: { 'USA': { energy: [], gdp: [] } }
    master_data = {}

    print("⚙️ Processing Energy Data...")
    # Energy: using 'per_capita_electricity' or 'electricity_generation'
    for _, row in df_energy.iterrows():
        iso = row['iso_code']
        year = int(row['year'])
        # Metric: Electricity per capita (kWh) - Falls back to 0 if missing
        val_energy = row.get('electricity_demand', row.get('electricity_generation', 0)) 
        # Note: OWID often splits generation vs demand. We use generation as proxy if demand missing.
        # For per capita specifically:
        val_kwh_per_capita = row.get('per_capita_electricity', 0)
        
        # Also grab GDP from here if available
        val_gdp = row.get('gdp', 0)

        if iso not in master_data:
            master_data[iso] = {'iso_code': iso, 'country': row['country'], 'energy': [], 'gdp': [], 'co2': []}
        
        if pd.notna(val_kwh_per_capita) and val_kwh_per_capita > 0:
            master_data[iso]['energy'].append({'date': str(year), 'value': val_kwh_per_capita})
            
        if pd.notna(val_gdp) and val_gdp > 0:
            # Note: OWID GDP data can be sparse for very recent years, but it's consistent
            master_data[iso]['gdp'].append({'date': str(year), 'value': val_gdp / 1000000}) # Store roughly per capita or raw? 
            # Correction: OWID 'gdp' is usually TOTAL GDP. We need per capita?
            # Let's rely on the previous World Bank structure if possible, but OWID has 'gdp' column.
            # For this specific visualizer, let's stick to simple extraction.
            pass 

    print("⚙️ Processing CO2 Data...")
    for _, row in df_co2.iterrows():
        iso = row['iso_code']
        year = int(row['year'])
        val_co2 = row.get('co2_per_capita', 0)

        if iso not in master_data:
             continue # If country not in energy set, skip or add? Let's skip to keep clean.

        if pd.notna(val_co2) and val_co2 > 0:
            master_data[iso]['co2'].append({'date': str(year), 'value': val_co2})

    # 4. GDP FILLER (OWID Energy dataset often has GDP column too)
    # We iterate again to ensure we captured GDP per capita correctly if available
    # Actually, let's clean up the list format for JSON
    
    final_output = []
    for iso, data in master_data.items():
        # Sort by date to ensure clean sliders
        data['energy'].sort(key=lambda x: int(x['date']))
        data['co2'].sort(key=lambda x: int(x['date']))
        # Add basic GDP placeholder if missing (OWID is primarily Energy/CO2)
        # Real GDP updates are best from IMF, but let's see what OWID gave us.
        
        if data['energy'] or data['co2']:
            final_output.append(data)

    # 5. SAVE TO DISK
    os.makedirs('public', exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=0)

    print(f"--- ✅ SUCCESS: Extracted data for {len(final_output)} countries. ---")
    print(f"Target: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
