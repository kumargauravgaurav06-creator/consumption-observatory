import json
import urllib.request
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']

# SOURCE 1: WORLD BANK (Energy & GDP)
wb_indicators = {
    "energy": "EG.USE.PCAP.KG.OE",
    "gdp":    "NY.GDP.PCAP.CD"
}

# SOURCE 2: OUR WORLD IN DATA (CO2)
# We download their full database directly.
OWID_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.json"

print("🤖 ROBOT V6: Initializing Federated Data Systems...")
data_storage = {}

# --- HELPER: WORLD BANK FETCHER ---
def get_world_bank_data(country, code):
    # Ask for the most recent valid number (mrnev=1)
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

# --- HELPER: OWID FETCHER (New!) ---
print("   ⬇️ Downloading OWID Climate Database (This may take a moment)...")
try:
    with urllib.request.urlopen(OWID_URL) as response:
        owid_db = json.loads(response.read().decode())
        print("   ✅ OWID Database Downloaded.")
except Exception as e:
    print(f"   ❌ OWID Download Failed: {e}")
    owid_db = {}

def get_owid_co2(country_code):
    # OWID uses ISO codes (USA, CHN, etc.) just like us.
    if country_code == "EUU": country_code = "OWID_EU27" # Special code for EU
    
    if country_code in owid_db:
        history = owid_db[country_code]['data']
        # Loop backwards to find the latest 'co2_per_capita'
        for entry in reversed(history):
            if 'co2_per_capita' in entry:
                return round(entry['co2_per_capita'], 2), str(entry['year'])
    return 0, "N/A"

# --- MAIN EXECUTION LOOP ---
for country in countries:
    print(f"   📍 Processing {country}...")
    data_storage[country] = {}

    # 1. Get Energy & GDP from World Bank
    for cat, code in wb_indicators.items():
        val, year = get_world_bank_data(country, code)
        data_storage[country][cat] = {"value": val, "year": year}
        print(f"      - {cat.upper()}: {val} ({year})")

    # 2. Get CO2 from OWID
    co2_val, co2_year = get_owid_co2(country)
    data_storage[country]['co2'] = {"value": co2_val, "year": co2_year}
    print(f"      - CO2: {co2_val} ({co2_year}) [Source: OWID]")

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 SYSTEM COMPLETE: Data merge successful.")
