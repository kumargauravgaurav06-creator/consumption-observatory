import json
import urllib.request
from datetime import datetime

# --- CONFIGURATION ZONE ---
# 1. New List of Countries (Added JPN, DEU, GBR, RUS)
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']

# 2. New Categories (The Robot will fetch all of these)
indicators = {
    "energy": "EG.USE.PCAP.KG.OE",  # Energy use (kg of oil equivalent per capita)
    "gdp":    "NY.GDP.PCAP.CD",     # GDP per capita (current US$)
    "co2":    "EN.ATM.CO2E.PC"      # CO2 emissions (metric tons per capita)
}
# ---------------------------

print("🤖 ROBOT V2: Starting Multi-Metric Search...")
data_storage = {}

for country in countries:
    data_storage[country] = {} # Create a folder for this country
    print(f"   📍 Analyzing {country}...")

    for category, code in indicators.items():
        # Fetch 5 years of data to find the most recent valid number
        url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&per_page=5&date=2019:2025"
        
        try:
            with urllib.request.urlopen(url) as response:
                raw_data = json.loads(response.read().decode())
                
                found_val = 0
                found_year = "N/A"

                if len(raw_data) > 1 and raw_data[1]:
                    for entry in raw_data[1]:
                        if entry['value'] is not None:
                            found_val = entry['value']
                            # Round GDP and Energy, keep decimals for CO2
                            if category != "co2":
                                found_val = round(found_val)
                            else:
                                found_val = round(found_val, 2)
                                
                            found_year = entry['date']
                            break
                
                # Save the specific metric into the country's folder
                data_storage[country][category] = {
                    "value": found_val,
                    "year": found_year
                }
                print(f"      - {category.upper()}: {found_val}")

        except Exception as e:
            print(f"      ❌ Error fetching {category}: {e}")
            data_storage[country][category] = {"value": 0, "year": "N/A"}

# Save to file
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 UPGRADE COMPLETE: Multi-metric database saved.")
