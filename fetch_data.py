import json
import urllib.request
from datetime import datetime

# 1. Who are we tracking?
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU']
indicator = "EG.USE.PCAP.KG.OE"

print("🤖 ROBOT: Starting Smart Search...")
data_storage = {}

for country in countries:
    # We ask for 5 years of data (2019-2024)
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=5&date=2019:2025"
    try:
        print(f"   ...Contacting World Bank for {country}...")
        with urllib.request.urlopen(url) as response:
            raw_data = json.loads(response.read().decode())
            
            if len(raw_data) > 1 and raw_data[1]:
                found_value = 0
                found_year = "N/A"
                
                # LOOP: Look for the first non-empty value
                for entry in raw_data[1]:
                    if entry['value'] is not None:
                        found_value = round(entry['value'])
                        found_year = entry['date']
                        break # Stop looking, we found one!
                
                data_storage[country] = {
                    "energy": found_value,
                    "year": found_year
                }
                print(f"   ✅ Found data for {country}: {found_value} (Year: {found_year})")
            else:
                data_storage[country] = {"energy": 0, "year": "N/A"}
                
    except Exception as e:
        print(f"   ❌ Error {country}: {e}")
        data_storage[country] = {"energy": 0, "year": "Error"}

# 2. Package and Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 MISSION COMPLETE: global_data.json saved.")
