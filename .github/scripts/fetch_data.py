import json
import urllib.request
from datetime import datetime

# 1. Who are we tracking? (Country Codes)
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU']
# Indicator Code for "Energy use (kg of oil equivalent per capita)"
indicator = "EG.USE.PCAP.KG.OE"

print("🤖 SYSTEM: Initializing Data Fetch...")

data_storage = {}

for country in countries:
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{indicator}?format=json&per_page=1&date=2020:2023"
    try:
        print(f"   ...Contacting World Bank for {country}...")
        with urllib.request.urlopen(url) as response:
            raw_data = json.loads(response.read().decode())
            
            # Extract the most recent value available
            if len(raw_data) > 1 and raw_data[1]:
                latest_entry = raw_data[1][0]
                value = latest_entry['value']
                # If value is None, use a placeholder
                if value is None:
                    value = 0
                
                data_storage[country] = {
                    "energy": round(value),
                    "year": latest_entry['date']
                }
            else:
                data_storage[country] = {"energy": 0, "year": "N/A"}
                
    except Exception as e:
        print(f"❌ ERROR fetching {country}: {e}")
        data_storage[country] = {"energy": 0, "year": "Error"}

# 2. Add a timestamp so we know when this last ran
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

# 3. Save the result to a file called 'global_stats.json'
# We write this locally; GitHub Actions will save it to the repo.
with open('global_stats.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("✅ SUCCESS: New data packet generated.")
print(json.dumps(final_packet, indent=2))
