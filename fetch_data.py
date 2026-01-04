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

# 2. OWID (CO2) - CSV Format for Speed
OWID_CSV_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

print("🤖 ROBOT V7: Initializing Data Stream...")
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

# --- HELPER: OWID STREAM PROCESSOR ---
def fetch_owid_co2_stream():
    print("   ⬇️ Streaming OWID Climate Data (CSV)...")
    co2_cache = {} # Stores latest found value for each country
    
    try:
        # Download the CSV as a stream
        with urllib.request.urlopen(OWID_CSV_URL) as response:
            # Decode line by line
            lines = [l.decode('utf-8') for l in response.readlines()]
            reader = csv.DictReader(lines)
            
            print("   ⚙️ Parsing data rows...")
            for row in reader:
                iso = row['iso_code']
                # Map special code for EU
                if iso == "OWID_EU27": iso = "EUU"
                
                # Only care if it's one of our target countries
                if iso in countries:
                    year = row['year']
                    co2 = row['co2_per_capita']
                    
                    # If data exists, update our cache (CSV is sorted by year, so last one is newest)
                    if co2 and co2 != "":
                        co2_cache[iso] = {
                            "value": round(float(co2), 2),
                            "year": year
                        }
        print(f"   ✅ Stream processing complete. Found data for {len(co2_cache)} countries.")
        return co2_cache
        
    except Exception as e:
        print(f"   ❌ CSV Stream Error: {e}")
        return {}

# --- EXECUTION ---
# 1. Fetch CO2 Cache first
co2_data = fetch_owid_co2_stream()

# 2. Loop through countries and assemble the packet
for country in countries:
    print(f"   📍 Assembling {country}...")
    data_storage[country] = {}

    # World Bank Metrics
    for cat, code in wb_indicators.items():
        val, year = get_world_bank_data(country, code)
        data_storage[country][cat] = {"value": val, "year": year}

    # CO2 Metric (From Cache)
    if country in co2_data:
        data_storage[country]['co2'] = co2_data[country]
        print(f"      - CO2: {co2_data[country]['value']} ({co2_data[country]['year']})")
    else:
        data_storage[country]['co2'] = {"value": 0, "year": "N/A"}
        print("      - CO2: 0 (No data in stream)")

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 SYSTEM COMPLETE: Global Data Sync Finished.")
