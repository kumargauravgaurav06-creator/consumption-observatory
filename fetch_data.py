import json
import urllib.request
import datetime

# 1. SETUP: Define the World Bank API URL
# Indicator: Energy use (kg of oil equivalent per capita) - EG.USE.PCAP.KG.OE
# We fetch 50 records from the most recent reporting year available via API
api_url = "http://api.worldbank.org/v2/country/all/indicator/EG.USE.PCAP.KG.OE?format=json&per_page=50&date=2020"

print("🤖 Waking up...")
print(f"📡 Connecting to World Bank API: {api_url}")

try:
    # 2. FETCH: Go to the URL and grab the data
    with urllib.request.urlopen(api_url) as response:
        data = json.loads(response.read().decode())
        
    # The World Bank API returns a list: [metadata, actual_data]
    # We only want the actual_data, which is at index 1
    raw_records = data[1]
    
    # 3. CLEAN: Process the messy data into simple JSON
    clean_data = []
    for record in raw_records:
        # Only keep records that have a real number value
        if record['value'] is not None:
            clean_data.append({
                "country": record['country']['value'],
                "energy_use": round(record['value'], 1)
            })
            
    # Sort the data: Highest energy users first
    clean_data.sort(key=lambda x: x['energy_use'], reverse=True)
    
    # Add a timestamp so we know when this last ran
    final_output = {
        "last_updated": str(datetime.datetime.now()),
        "source": "World Bank Open Data",
        "records": clean_data
    }
    
    # 4. SAVE: Write the result to a file called 'global_data.json'
    with open('global_data.json', 'w') as f:
        json.dump(final_output, f, indent=2)
        
    print(f"✅ Success! Saved {len(clean_data)} country records to global_data.json")

except Exception as e:
    print(f"❌ Error occurred: {e}")
