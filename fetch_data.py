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

print("🤖 ROBOT V4: Starting 'Most Recent Value' Search...")
data_storage = {}

for country in countries:
    data_storage[country] = {} 
    print(f"   📍 Analyzing {country}...")

    for category, code in indicators.items():
        # MAGIC FIX: mrnev=1 asks for the "Most Recent Non-Empty Value"
        # This forces the API to find data, even if it's from 2018 or 2014.
        url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&mrnev=1"
        
        try:
            with urllib.request.urlopen(url) as response:
                raw_data = json.loads(response.read().decode())
                
                found_val = 0
                found_year = "N/A"

                # Check if we got a valid response packet
                if len(raw_data) > 1 and raw_data[1]:
                    # Since we used mrnev=1, the first item is ALWAYS the best one
                    entry = raw_data[1][0]
                    
                    if entry['value'] is not None:
                        val = entry['value']
                        
                        # Formatting
                        if category == "co2":
                            found_val = round(val, 2)
                        else:
                            found_val = round(val)
                            
                        found_year = entry['date']
                
                # Save it
                data_storage[country][category] = {
                    "value": found_val,
                    "year": found_year
                }
                print(f"      - {category.upper()}: {found_val} ({found_year})")

        except Exception as e:
            print(f"      ❌ Error fetching {category}: {e}")
            data_storage[country][category] = {"value": 0, "year": "N/A"}

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 MISSION COMPLETE: Smart search finished.")
