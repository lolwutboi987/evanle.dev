with open('energy-map.html', 'r') as f:
    content = f.read()

# Add a trim to the search input
content = content.replace(
    "const city = document.getElementById('city-search').value;",
    "const city = document.getElementById('city-search').value.trim();"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
