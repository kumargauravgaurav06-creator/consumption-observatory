import json
import urllib.request
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']
indicators = {
    "energy": "EG.USE.PCAP.KG.OE",  # Energy Use
    "gdp":    "NY.GDP.PCAP.CD",     # GDP Per Capita
    "co2":    "EN.ATM.CO2E.PC"      # CO2 Emissions
}

print("🤖 CRAWLER ENGINE V1: Initializing Temporal Search...")
data_storage = {}

# --- THE CRAWLER FUNCTION ---
def get_latest_valid_data(country, code):
    """
    Fetches last 20 years of data and crawls backwards 
    until it finds a non-empty value.
    """
    # Request last 20 entries (per_page=20) to ensure we hit a valid year
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&per_page=20"
    
    try:
        with urllib.request.urlopen(url) as response:
            raw_data = json.loads(response.read().decode())
            
            # World Bank returns [metadata, [data_list]]
            if len(raw_data) > 1 and raw_data[1]:
                data_list = raw_data[1]
                
                # CRAWL: Loop through the years (newest to oldest)
                for entry in data_list:
                    if entry['value'] is not None:
                        val = entry['value']
                        year = entry['date']
                        
                        # Formatting
                        if code == "EN.ATM.CO2E.PC": # CO2
                            final_val = round(val, 2)
                        else:
                            final_val = round(val)
                            
                        return final_val, year
                        
    except Exception as e:
        print(f"      ❌ Connection failed for {country}: {e}")
    
    return 0, "N/A" # Fallback if 20 years of history is empty

# --- MAIN EXECUTION ---
for country in countries:
    data_storage[country] = {} 
    print(f"   📍 Scanning history for {country}...")

    for category, code in indicators.items():
        value, year = get_latest_valid_data(country, code)
        
        data_storage[country][category] = {
            "value": value,
            "year": year
        }
        
        if value > 0:
            print(f"      ✅ {category.upper()}: Found {value} (from {year})")
        else:
            print(f"      ⚠️ {category.upper()}: No data in last 20 years.")

# Save Data
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 CRAWLER FINISHED: Database fully automated and self-healing.")
