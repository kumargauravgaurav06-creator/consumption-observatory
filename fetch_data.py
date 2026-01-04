import json
import urllib.request
from datetime import datetime

# --- CONFIGURATION: 10 Major Economies ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']

# --- METRICS TO TRACK ---
indicators = {
    "energy": "EG.USE.PCAP.KG.OE",  # Energy Use (kg oil equiv)
    "gdp":    "NY.GDP.PCAP.CD",     # GDP Per Capita (USD)
    "co2":    "EN.ATM.CO2E.PC"      # CO2 Emissions (metric tons)
}

print("🤖 ROBOT V2: Starting Multi-Metric Mission...")
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
                            val = entry['value']
                            
                            # Formatting: Round GDP/Energy, keep decimals for CO2
                            if category == "co2":
                                found_val = round(val, 2)
                            else:
                                found_val = round(val)
                                
                            found_year = entry['date']
                            break # Found it! Stop looking.
                
                # Save the data
                data_storage[country][category] = {
                    "value": found_val,
                    "year": found_year
                }
                print(f"      - {category.upper()}: {found_val} ({found_year})")

        except Exception as e:
            print(f"      ❌ Error fetching {category}: {e}")
            data_storage[country][category] = {"value": 0, "year": "N/A"}

# Save the package
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 MISSION COMPLETE: Multi-metric database saved.")
