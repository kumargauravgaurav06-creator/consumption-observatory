import json
import urllib.request
from datetime import datetime

# 1. Who are we tracking?
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU']
indicator = "EG.USE.PCAP.KG.OE"

print("🤖 ROBOT: Starting Mission...")
data_storage = {}

for country in countries:
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=1&date=2020:2024"
    try:
        print(f"   ...Contacting World Bank for {country}...")
        with urllib.request.urlopen(url) as response:
            raw_data = json.loads(response.read().decode())
            
            # Extract data
            if len(raw_data) > 1 and raw_data[1]:
                latest_entry = raw_data[1][0]
                val = latest_entry['value']
                year = latest_entry['date']
                
                # Check for empty values
                final_val = round(val) if val else 0
                
                data_storage[country] = {
                    "energy": final_val,
                    "year": year
                }
                print(f"   ✅ Got {country}: {final_val}")
            else:
                data_storage[country] = {"energy": 0, "year": "N/A"}
                
    except Exception as e:
        print(f"   ❌ Error {country}: {e}")
        data_storage[country] = {"energy": 0, "year": "Error"}

# 2. Package the data properly
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

# 3. Save to the file your website expects
with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 MISSION COMPLETE: global_data.json saved.")
print(json.dumps(final_packet, indent=2))
