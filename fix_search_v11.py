with open('energy-map.html', 'r') as f:
    content = f.read()

# Make search even more robust with case insensitivity in SQL
content = content.replace(
    "(NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%')",
    "(UPPER(NAME) LIKE UPPER('${cityName}%') OR UPPER(BASENAME) LIKE UPPER('${cityName}%'))"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
