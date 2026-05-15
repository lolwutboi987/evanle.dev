with open('energy-map.html', 'r') as f:
    content = f.read()

# Refine search query for TIGERweb Layer 25
# layer 25 = Places
# We want BASENAME match or NAME match
content = content.replace(
    "where=${encodeURIComponent(`(UPPER(NAME) LIKE UPPER('${cityName}%') OR UPPER(BASENAME) LIKE UPPER('${cityName}%')) AND STATE='${stateFips}'`)}",
    "where=${encodeURIComponent(`(UPPER(BASENAME) = UPPER('${cityName}') OR UPPER(NAME) LIKE UPPER('${cityName}%')) AND STATE='${stateFips}'`)}"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
