with open('energy-map.html', 'r') as f:
    content = f.read()

# Improved search logic for TIGERweb
content = content.replace(
    "where=UPPER(BASENAME)='${cityName.toUpperCase()}'",
    "where=NAME LIKE '${cityName}%'"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
