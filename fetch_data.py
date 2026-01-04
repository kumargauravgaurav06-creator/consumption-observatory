import json
import urllib.request
import csv
import io
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']

# 1. World Bank (Energy & GDP)
wb_indicators = {
    "energy": "EG.USE.PCAP.KG.OE",
    "gdp":    "NY.GDP.PCAP.CD"
}

# 2. OWID (CO2) - Direct CSV Stream
OWID_CSV_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

print("🤖 ROBOT V9: Starting Enterprise Data Sync...")
data_storage = {}

# --- HELPER: WORLD BANK ---
def get_world_bank_data(country, code):
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&mrnev=1"
    try:
        with urllib.request.urlopen(url) as response:
            raw = json.loads(response.read().decode())
            if len(raw) > 1 and raw[1]:
                entry = raw[1][0]
                val = entry['value']
                return round(val) if val else 0, entry['date']
    except:
        pass
    return 0, "N/A"

# --- HELPER: OWID STREAM ENGINE ---
def fetch_owid_co2_stream():
    print("   ⬇️ Streaming OWID Climate Database...")
    co2_cache = {} 
    
    try:
        # Stream the CSV line-by-line (Memory Efficient)
        response = urllib.request.urlopen(OWID_CSV_URL)
        text_stream = io.TextIOWrapper(response, encoding='utf-8')
        reader = csv.DictReader(text_stream)
        
        for row in reader:
            iso = row.get('iso_code')
            if iso == "OWID_EU27": iso = "EUU"
            
            if iso in countries:
                year = row.get('year')
                co2_raw = row.get('co2_per_capita')
                
                if co2_raw and co2_raw.strip() != "":
                    try:
                        # Update cache with latest year found
                        co2_cache[iso] = {
                            "value": round(float(co2_raw), 2),
                            "year": year
                        }
                    except ValueError:
                        pass
        return co2_cache
        
    except Exception as e:
        print(f"   ❌ Stream Error: {e}")
        return {}

# --- MAIN EXECUTION ---
# 1. Fetch CO2
co2_data = fetch_owid_co2_stream()

# 2. Assemble Country Data
for country in countries:
    print(f"   📍 Processing {country}...")
    data_storage[country] = {}

    # World Bank Metrics
    for cat, code in wb_indicators.items():
        val, year = get_world_bank_data(country, code)
        data_storage[country][cat] = {"value": val, "year": year}

    # CO2 Metrics
    if country in co2_data:
        data_storage[country]['co2'] = co2_data[country]
    else:
        data_storage[country]['co2'] = {"value": 0, "year": "N/A"}

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 SYNC COMPLETE: Global Observatory Updated.")
