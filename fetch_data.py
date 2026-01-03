import json
import urllib.request
import datetime

# CONFIGURATION: The 3 metrics we want to track
INDICATORS = {
    "energy": "EG.USE.PCAP.KG.OE",  # Energy use (kg oil equivalent per capita)
    "co2": "EN.ATM.CO2E.PC",        # CO2 emissions (metric tons per capita)
    "gdp": "NY.GDP.PCAP.CD"         # GDP per capita (current US$)
}

def fetch_world_bank_data(indicator_code):
    """Fetches 100 records for a specific indicator."""
    url = f"http://api.worldbank.org/v2/country/all/indicator/{indicator_code}?format=json&per_page=100&date=2020"
    print(f"   ...fetching {indicator_code} from World Bank...")
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
        return data[1] # Return the actual list of country data
    except Exception as e:
        print(f"Error fetching {indicator_code}: {e}")
        return []

print("🤖 Waking up... Preparing to fetch Multi-Metric Data.")

# 1. Fetch all datasets
raw_data = {}
for name, code in INDICATORS.items():
    raw_data[name] = fetch_world_bank_data(code)

# 2. Merge data by Country
# We use a dictionary keyed by "Country Code" (like USA, IND, CHN) to merge them
merged_countries = {}

# Process Energy first to build the base list
for record in raw_data['energy']:
    if record['value'] is not None:
        country_code = record['countryiso3code']
        merged_countries[country_code] = {
            "country": record['country']['value'],
            "code": country_code,
            "energy": round(record['value'], 1),
            "co2": None, # Placeholders
            "gdp": None
        }

# Helper function to add other metrics
def add_metric(metric_name):
    for record in raw_data[metric_name]:
        if record['value'] is not None and record['countryiso3code'] in merged_countries:
            merged_countries[record['countryiso3code']][metric_name] = round(record['value'], 1)

# Add CO2 and GDP to the existing countries
add_metric('co2')
add_metric('gdp')

# 3. Clean and Format
# Convert dictionary back to a list and remove incomplete records
final_list = []
for code, data in merged_countries.items():
    # Only keep countries that have ALL three data points (for good comparisons)
    if data['energy'] and data['co2'] and data['gdp']:
        final_list.append(data)

# Sort by Energy use (High to Low)
final_list.sort(key=lambda x: x['energy'], reverse=True)

# 4. Save
output = {
    "last_updated": str(datetime.datetime.now()),
    "source": "World Bank Open Data",
    "metrics": ["Energy (kg oil)", "CO2 (tons)", "GDP ($)"],
    "records": final_list
}

with open('global_data.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"✅ Success! Merged data for {len(final_list)} countries.")
