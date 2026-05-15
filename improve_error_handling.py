with open('energy-map.html', 'r') as f:
    content = f.read()

# Enhance fetchACSData with detailed logging
content = content.replace(
    "catch (e) { console.error(\"ACS Fetch Error:\", e); }",
    "catch (e) { console.error(`ACS Fetch Error for State ${stateFips} Place ${placeFips}:`, e); }"
)

# Robust fallback for fetchCityData
content = content.replace(
    "currentRegion = fullName;",
    "console.log(`Successfully mapped ${cityName} to ${fullName} (Place: ${placeFips})`); currentRegion = fullName;"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
