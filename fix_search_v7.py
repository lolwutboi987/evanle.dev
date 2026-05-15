with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix the query logic and the field name (PLACE vs PLACEFP)
# Based on the curl, 'PLACE' exists, not 'PLACEFP'
content = content.replace(
    "where=NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%' AND STATE='${stateFips}'&outFields=NAME,STATE,POP100,GEOID,PLACEFP",
    "where=(NAME LIKE '${cityName}%' OR BASENAME LIKE '${cityName}%') AND STATE='${stateFips}'&outFields=NAME,STATE,POP100,GEOID,PLACE"
)

content = content.replace(
    "const placeFips = feature.properties.PLACEFP || feature.properties.GEOID.slice(-5);",
    "const placeFips = feature.properties.PLACE || feature.properties.GEOID.slice(-5);"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
