with open('energy-map.html', 'r') as f:
    content = f.read()

# Improved search UX
content = content.replace(
    "currentRegion = fullName;",
    "console.log(`Successfully mapped ${cityName} to ${fullName}`); currentRegion = fullName;"
)

# Better city not found feedback
content = content.replace(
    "else { console.error('City not found:', cityName); }",
    "else { console.warn('City not found:', cityName); btn.innerText = 'NOT FOUND'; setTimeout(() => btn.innerText = 'Initialize Search', 2000); }"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
