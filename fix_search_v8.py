with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix the button text case consistency
content = content.replace(
    "btn.innerText = 'INITIALIZE SEARCH';",
    "btn.innerText = 'Initialize Search';"
)
content = content.replace(
    "btn.innerText = 'INITIALIZING...';",
    "btn.innerText = 'Initializing...';"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
