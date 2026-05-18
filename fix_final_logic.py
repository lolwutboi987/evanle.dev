import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# 1. Update fetchGridData (Line 610 range)
# Note: I noticed there are two fetchGridData-like blocks in my previous grep. Let's fix the main one.
fetch_grid_improved = """        async function fetchGridData(key) {
            const baMap = { 'CA': 'CISO', 'TX': 'ERCO', 'NY': 'NYIS', 'FL': 'FPL', 'WA': 'BPAT', 'IL': 'PJM', 'AZ': 'SRP', 'NV': 'NEVP', 'OR': 'BPAT', 'UT': 'PACE', 'GA': 'SOCO', 'NC': 'DUK' };
            const city = DEMO_CITIES[currentRegion];
            const state = city ? city.state : currentRegion;
            const ba = baMap[state] || 'CISO';
            try {
                const res = await fetch(`https://api.eia.gov/v2/electricity/rto/region-data/data/?api_key=${key}&frequency=hourly&data[]=value&facets[respondent][]=${ba}&sort[0][column]=period&sort[0][direction]=desc&length=24`);
                const json = await res.json();
                if (json && json.response && json.response.data && json.response.data.length > 0) {
                    const gridTrend = json.response.data.map(d => d.value).reverse();
                    updateGridChart(gridTrend, ba);
                } else {
                    document.getElementById('grid-panel').style.display = 'none';
                }
            } catch (e) {
                console.error("Grid API Error:", e);
                document.getElementById('grid-panel').style.display = 'none';
            }
        }"""

# Replace the existing fetchGridData
content = re.sub(r"async function fetchGridData\(key\) \{.*?\}", fetch_grid_improved, content, flags=re.DOTALL)

# 2. Fix the "await" error in init if it's there
# Actually, the error might be because init is called via window.onload = init;
# If init is async, window.onload = init; is fine in modern browsers,
# but "await is only valid in async functions" usually means an await was used outside an async block.
# Let's check for any top-level awaits.

with open('energy-map.html', 'w') as f:
    f.write(content)
