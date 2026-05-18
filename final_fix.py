import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# 1. Fix Case Sensitivity in Search
content = content.replace(
    "where=BASENAME='${cityName}'",
    "where=UPPER(BASENAME)='${cityName.toUpperCase()}'"
)

# 2. Fix Color Grades for Per Capita (kWh/mo)
# Typical range 500-1500 kWh/person/month
content = content.replace(
    "[0, 2000, 4000, 6000, 8000, 10000, 12000]",
    "[0, 400, 700, 1000, 1300, 1600, 2000]"
)
content = content.replace(
    "(view === 'elec' ? [0, 4000, 8000, 12000]",
    "(view === 'elec' ? [0, 500, 1000, 1500]"
)

# 3. Add Demo ACS data to initial cities to show variance immediately
demo_cities_new = """        const DEMO_CITIES = {
            'San Francisco': { lat: 37.7749, lng: -122.4194, pop: 815269, state: 'CA', acs: { elecIntensity: 1.2, gasIntensity: 0.8, incomeFactor: 1.4 } },
            'San Jose': { lat: 37.3382, lng: -121.8863, pop: 983489, state: 'CA', acs: { elecIntensity: 1.1, gasIntensity: 0.9, incomeFactor: 1.5 } },
            'Seattle': { lat: 47.6062, lng: -122.3321, pop: 737015, state: 'WA', acs: { elecIntensity: 1.4, gasIntensity: 0.5, incomeFactor: 1.3 } }
        };"""

content = re.sub(r"const DEMO_CITIES = \{.*?^\s+};" , demo_cities_new, content, flags=re.DOTALL | re.MULTILINE)

# 4. Fix possible division by zero or NaN in perCapita calc
content = content.replace(
    "val = (val * getUnits().conv / censusData[stateCode]);",
    "val = censusData[stateCode] > 0 ? (val * getUnits().conv / censusData[stateCode]) : 0;"
)

# 5. Fix "already declared" gridChart if it happened again (paranoia)
# I checked before, it's 'let map, comparisonChart, trendChart, gridChart;' at top.
# And 'gridChart = new Chart...' in initGridChart. This is correct.

with open('energy-map.html', 'w') as f:
    f.write(content)
