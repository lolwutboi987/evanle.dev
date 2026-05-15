with open('energy-map.html', 'r') as f:
    content = f.read()

# Remove the console logs to clean up before submission
content = content.replace(
    "console.log('Fetching ACS for State:', stateFips, 'Place:', placeFips); ",
    ""
)
content = content.replace(
    " console.log('ACS Result:', acs);",
    ""
)
content = content.replace(
    "console.log(`Successfully mapped ${cityName} to ${fullName} (Place: ${placeFips})`); ",
    ""
)

with open('energy-map.html', 'w') as f:
    f.write(content)
