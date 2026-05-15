with open('energy-map.html', 'r') as f:
    content = f.read()

# Encode the query parameters properly
content = content.replace(
    "where=(NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%') AND STATE='${stateFips}'",
    "where=${encodeURIComponent(`(NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%') AND STATE='${stateFips}'`)}"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
