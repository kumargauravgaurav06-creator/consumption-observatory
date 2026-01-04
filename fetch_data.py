import json
import urllib.request
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']
indicators = {
    "energy": "EG.USE.PCAP.KG.OE",
    "gdp":    "NY.GDP.PCAP.CD",
    "co2":    "EN.ATM.CO2E.PC"
}

print("🤖 ROBOT V3: Starting Deep Search (2015-2025)...")
data_storage = {}

for country in countries:
    data_storage[country] = {} 
    print(f"   📍 Analyzing {country}...")

    for category, code in indicators.items():
        # UPDATE: Looking back 10 years (2015-2025) to find CO2 data
        url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&per_page=10&date=2015:2025"
        
        try:
            with urllib.request.urlopen(url) as response:
                raw_data = json.loads(response.read().decode())
                
                found_val = 0
                found_year = "N/A"

                if len(raw_data) > 1 and raw_data[1]:
                    for entry in raw_data[1]:
                        if entry['value'] is not None:
                            val = entry['value']
                            
                            if category == "co2":
                                found_val = round(val, 2)
                            else:
                                found_val = round(val)
                                
                            found_year = entry['date']
                            break 
                
                data_storage[country][category] = {
                    "value": found_val,
                    "year": found_year
                }
                print(f"      - {category.upper()}: {found_val} ({found_year})")

        except Exception as e:
            print(f"      ❌ Error fetching {category}: {e}")
            data_storage[country][category] = {"value": 0, "year": "N/A"}

final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 MISSION COMPLETE: Deep search finished.")
