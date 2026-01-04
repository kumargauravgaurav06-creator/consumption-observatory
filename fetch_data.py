import json
import urllib.request
import csv
import io
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']
start_year = 2000
end_year = 2025

# 1. World Bank (Energy & GDP)
wb_indicators = {
    "energy": "EG.USE.PCAP.KG.OE",
    "gdp":    "NY.GDP.PCAP.CD"
}

# 2. OWID (CO2)
OWID_CSV_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

print("🤖 ROBOT V10: Initializing Time-Travel Engine (2000-2024)...")
data_storage = {}

# Initialize empty storage
for c in countries:
    data_storage[c] = {"energy": [], "gdp": [], "co2": []}

# --- HELPER: WORLD BANK HISTORIAN ---
def fetch_wb_history(country, code, category):
    # Fetch 25 years of data
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&date={start_year}:{end_year}&per_page=100"
    try:
        with urllib.request.urlopen(url) as response:
            raw = json.loads(response.read().decode())
            if len(raw) > 1 and raw[1]:
                history = []
                for entry in raw[1]:
                    if entry['value'] is not None:
                        history.append({
                            "year": int(entry['date']),
                            "value": int(entry['value']) # Rounding for smaller file size
                        })
                # Sort by year (Old -> New)
                history.sort(key=lambda x: x['year'])
                data_storage[country][category] = history
                print(f"   ✅ {country} {category}: Retrieved {len(history)} years.")
    except Exception as e:
        print(f"   ❌ WB Error {country}: {e}")

# --- HELPER: OWID STREAM HISTORIAN ---
def fetch_owid_history():
    print("   ⬇️ Streaming 100MB Climate History...")
    try:
        response = urllib.request.urlopen(OWID_CSV_URL)
        text_stream = io.TextIOWrapper(response, encoding='utf-8')
        reader = csv.DictReader(text_stream)
        
        for row in reader:
            iso = row.get('iso_code')
            if iso == "OWID_EU27": iso = "EUU"
            
            if iso in countries:
                year = row.get('year')
                co2 = row.get('co2_per_capita')
                
                if year and co2 and co2.strip() != "":
                    yr_int = int(year)
                    if start_year <= yr_int <= end_year:
                        data_storage[iso]["co2"].append({
                            "year": yr_int,
                            "value": round(float(co2), 2)
                        })
    except Exception as e:
        print(f"   ❌ Stream Error: {e}")

# --- EXECUTION ---
# 1. Fetch CO2 History
fetch_owid_history()

# 2. Fetch Energy & GDP History
for country in countries:
    print(f"   📍 Building Timeline for {country}...")
    # Sort CO2 (since CSV stream isn't always ordered)
    data_storage[country]["co2"].sort(key=lambda x: x['year'])
    
    # Fetch WB Data
    for cat, code in wb_indicators.items():
        fetch_wb_history(country, code, cat)

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 TIME MACHINE READY: Historical database compiled.")
