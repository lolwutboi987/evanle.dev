with open('energy-map.html', 'r') as f:
    content = f.read()

# Make ACS Intensity more robust (avoid 0/NaN)
content = content.replace(
    "elecIntensity: (elec / total) / 0.25,",
    "elecIntensity: total > 0 ? (elec / total) / 0.25 : 1,"
)
content = content.replace(
    "gasIntensity: (gas / total) / 0.50,",
    "gasIntensity: total > 0 ? (gas / total) / 0.50 : 1,"
)

# Fix fetchCityData alert (it might block Playwright)
content = content.replace(
    "else { alert('City not found.'); }",
    "else { console.error('City not found:', cityName); }"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
