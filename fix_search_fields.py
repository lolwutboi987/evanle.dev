with open('energy-map.html', 'r') as f:
    content = f.read()

# Add BASENAME to outFields
content = content.replace(
    "outFields=NAME,STATE,POP100,GEOID,PLACE",
    "outFields=NAME,STATE,POP100,GEOID,PLACE,BASENAME"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
