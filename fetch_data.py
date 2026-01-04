import json
import urllib.request
import csv
import io
from datetime import datetime

# --- CONFIGURATION ---
countries = ['USA', 'CHN', 'IND', 'BRA', 'NGA', 'EUU', 'JPN', 'DEU', 'GBR', 'RUS']

# 1. World Bank (Energy & GDP)
wb_indicators = {
    "energy": "EG.USE.PCAP.KG.OE",
    "gdp":    "NY.GDP.PCAP.CD"
}

# 2. OWID (CO2) - Direct CSV Link
OWID_CSV_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"

print("🤖 ROBOT V8: Diagnostic Probe Initiated...")
data_storage = {}

# --- HELPER: WORLD BANK ---
def get_world_bank_data(country, code):
    url = f"http://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&mrnev=1"
    try:
        with urllib.request.urlopen(url) as response:
            raw = json.loads(response.read().decode())
            if len(raw) > 1 and raw[1]:
                entry = raw[1][0]
                val = entry['value']
                return round(val) if val else 0, entry['date']
    except Exception as e:
        print(f"      ⚠️ WB Error ({country}): {e}")
    return 0, "N/A"

# --- HELPER: OWID STREAM PROBE ---
def fetch_owid_co2_stream():
    print("   ⬇️ connecting to OWID Database...")
    co2_cache = {} 
    
    try:
        # STREAMING REQUEST (Low Memory Usage)
        response = urllib.request.urlopen(OWID_CSV_URL)
        
        # Wrapper to read bytes as text stream on the fly
        text_stream = io.TextIOWrapper(response, encoding='utf-8')
        reader = csv.DictReader(text_stream)
        
        # DIAGNOSTIC: Print the columns we found
        print(f"   🔎 Columns Found: {reader.fieldnames}")
        
        row_count = 0
        usa_found = False
        
        for row in reader:
            row_count += 1
            iso = row.get('iso_code')
            
            # Map EU code
            if iso == "OWID_EU27": iso = "EUU"
            
            # DEBUG: Check if we see USA
            if iso == "USA" and not usa_found:
                print(f"   ✅ Found USA entry! Year: {row.get('year')}, CO2: {row.get('co2_per_capita')}")
                usa_found = True

            if iso in countries:
                year = row.get('year')
                # CAREFUL: 'co2_per_capita' might be empty string ""
                co2_raw = row.get('co2_per_capita')
                
                if co2_raw and co2_raw.strip() != "":
                    try:
                        val = float(co2_raw)
                        co2_cache[iso] = {
                            "value": round(val, 2),
                            "year": year
                        }
                    except ValueError:
                        pass # Ignore weird non-number values

        print(f"   ✅ Scanned {row_count} rows. Cache size: {len(co2_cache)} countries.")
        return co2_cache
        
    except Exception as e:
        print(f"   ❌ FATAL STREAM ERROR: {e}")
        return {}

# --- EXECUTION ---
# 1. Run the Probe
co2_data = fetch_owid_co2_stream()

# 2. Assemble Data
for country in countries:
    data_storage[country] = {}

    # World Bank
    print(f"   📍 Processing {country}...")
    for cat, code in wb_indicators.items():
        val, year = get_world_bank_data(country, code)
        data_storage[country][cat] = {"value": val, "year": year}

    # CO2 (From Cache)
    if country in co2_data:
        data = co2_data[country]
        data_storage[country]['co2'] = data
        print(f"      - CO2: {data['value']} ({data['year']})")
    else:
        # FAILSAFE: If stream failed, use manual backup so site doesn't show 0
        backup_val = 14.4 if country == "USA" else 0
        data_storage[country]['co2'] = {"value": backup_val, "year": "Est."}
        print(f"      - CO2: {backup_val} (Backup - No Stream Data)")

# Save
final_packet = {
    "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "data": data_storage
}

with open('global_data.json', 'w') as f:
    json.dump(final_packet, f, indent=2)

print("🎉 PROBE COMPLETE.")
