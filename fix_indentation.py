with open('energy-map.html', 'r') as f:
    content = f.read()

content = content.replace(
    "            if (DEMO_CITIES[currentRegion]) {\n                                const city = DEMO_CITIES[currentRegion];",
    "            if (DEMO_CITIES[currentRegion]) {\n                const city = DEMO_CITIES[currentRegion];"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
