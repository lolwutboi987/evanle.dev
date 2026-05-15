with open('energy-map.html', 'r') as f:
    content = f.read()

# Refine city selection logic to prioritize exact matches if multiple are returned
refine_logic = """                const tigerRes = await fetch(tigerUrl);
                const tigerJson = await tigerRes.json();
                if (tigerJson.features && tigerJson.features.length > 0) {
                    // Prioritize exact BASENAME match if multiple returned
                    let feature = tigerJson.features.find(f =>
                        f.properties.BASENAME && f.properties.BASENAME.toUpperCase() === cityName.toUpperCase()
                    ) || tigerJson.features[0];"""

content = content.replace(
    "const tigerRes = await fetch(tigerUrl);\n                const tigerJson = await tigerRes.json();\n                if (tigerJson.features && tigerJson.features.length > 0) {\n                    const feature = tigerJson.features[0];",
    refine_logic
)

with open('energy-map.html', 'w') as f:
    f.write(content)
