import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix TIGERweb query fields
content = content.replace(
    "outFields=NAME,STATE,POP100&f=geojson",
    "outFields=NAME,STATE,POP100,GEOID,PLACEFP&f=geojson"
)

# Fix placeFips extraction
content = content.replace(
    "const placeFips = feature.properties.PLACE || feature.properties.GEOID.slice(-5);",
    "const placeFips = feature.properties.PLACEFP || feature.properties.GEOID.slice(-5);"
)

# Update DEMO_STATES to more realistic monthly values (MWh)
# California uses ~250 TWh/year = 20,800,000 MWh/month
content = re.sub(
    r"'CA': \{ value: 250218, trend: \[242, 245, 250, 248, 252, 255\], name: 'California' \}",
    r"'CA': { value: 21000000, trend: [20500, 20800, 21000, 20900, 21200, 21500], name: 'California' }",
    content
)
content = re.sub(
    r"'TX': \{ value: 425621, trend: \[410, 415, 425, 420, 430, 435\], name: 'Texas' \}",
    r"'TX': { value: 35000000, trend: [34000, 34500, 35000, 34800, 35500, 36000], name: 'Texas' }",
    content
)

with open('energy-map.html', 'w') as f:
    f.write(content)
