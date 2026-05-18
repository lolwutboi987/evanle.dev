import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# 1. Align trend units with value units in DEMO_STATES
# Currently value is ~21,000,000 but trend is [21000, ...]
# We should make trend values full MWh as well.
content = content.replace(
    "[20500, 20800, 21000, 20900, 21200, 21500]",
    "[20500000, 20800000, 21000000, 20900000, 21200000, 21500000]"
)
content = content.replace(
    "[34000, 34500, 35000, 34800, 35500, 36000]",
    "[34000000, 34500000, 35000000, 34800000, 35500000, 36000000]"
)
# For NY and WA (if I updated them)
content = content.replace(
    "[12000, 12200, 12500, 12300, 12800, 13000]",
    "[12000000, 12200000, 12500000, 12300000, 12800000, 13000000]"
)
content = content.replace(
    "[7200, 7300, 7500, 7400, 7600, 7700]",
    "[7200000, 7300000, 7500000, 7400000, 7600000, 7700000]"
)

# 2. Fix City Trend to include ACS weighting
# Old: let base = (energyData[view][city.state].value / censusData[city.state]) * city.pop;
# New:
city_trend_fix = """                const city = DEMO_CITIES[currentRegion];
                const acs = city.acs || { elecIntensity: 1, gasIntensity: 1, incomeFactor: 1 };
                const intensity = view === 'elec' ? acs.elecIntensity : (view === 'ng' ? acs.gasIntensity : 1);
                let base = (energyData[view][city.state].value / censusData[city.state]) * city.pop * intensity * acs.incomeFactor;"""

content = content.replace(
    "const city = DEMO_CITIES[currentRegion];\n                let base = (energyData[view][city.state].value / censusData[city.state]) * city.pop;",
    city_trend_fix
)

with open('energy-map.html', 'w') as f:
    f.write(content)
