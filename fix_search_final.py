with open('energy-map.html', 'r') as f:
    content = f.read()

# Fallback search logic
content = content.replace(
    "where=NAME LIKE '${cityName}%'",
    "where=NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%'"
)

# Fix perCapita efficiency comparison chart
content = content.replace(
    "return metric === 'perCapita' ? (v * getUnits().conv / censusData[s]) : v;",
    "return metric === 'perCapita' ? (v * getUnits().conv / (censusData[s] || 1)) : v;"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
