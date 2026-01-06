import requests
import json
import pandas as pd
import os
from datetime import datetime

# CONFIGURATION
INDICATORS = {
    'energy': 'EG.USE.ELEC.KH.PC',  # Electric power consumption (kWh per capita)
    'gdp': 'NY.GDP.PCAP.CD',        # GDP per capita (current US$)
    'co2': 'EN.ATM.CO2E.PC'         # CO2 emissions (metric tons per capita)
}

# SAVE PATH (Directly to public folder)
OUTPUT_FILE = 'public/global_data.json'

def fetch_world_bank_data(indicator):
    """Fetches data for all countries for the last 5 years"""
    url = f"http://api.worldbank.org/v2/country/all/indicator/{indicator}?format=json&per_page=1000&date=2020:2025"
    print(f"Fetching {indicator}...")
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if len(data) < 2:
            print("Warning: No data returned")
            return []
            
        return data[1] # The actual data is in the second element
    except Exception as e:
        print(f"Error fetching {indicator}: {e}")
        return []

def main():
    print("--- STARTING TEMPORAL CRAWLER ---")
    
    combined_data = {}

    # 1. Fetch Data for each metric
    for key, code in INDICATORS.items():
        raw_data = fetch_world_bank_data(code)
        
        for entry in raw_data:
            country_code = entry.get('countryiso3code', '')
            if not country_code: continue
            
            # Initialize country if new
            if country_code not in combined_data:
                combined_data[country_code] = {
                    'iso_code': country_code,
                    'name': entry['country']['value'],
                    'energy': [], 'gdp': [], 'co2': []
                }
            
            # Add value if it exists
            if entry['value'] is not None:
                combined_data[country_code][key].append({
                    'date': entry['date'],
                    'value': entry['value']
                })

    # 2. Convert to List format for saving
    final_output = list(combined_data.values())
    
    # 3. Save to Public Folder
    os.makedirs('public', exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(final_output, f, indent=2)
        
    print(f"--- SUCCESS: Data saved to {OUTPUT_FILE} ---")
    print(f"Total Countries: {len(final_output)}")

if __name__ == "__main__":
    main()
