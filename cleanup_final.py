with open('energy-map.html', 'r') as f:
    content = f.read()

content = content.replace("console.log(`Successfully mapped ${cityName} to ${fullName}`); ", "")
content = content.replace("console.log('Fetching ACS for State:', stateFips, 'Place:', placeFips); ", "")
content = content.replace(" console.log('ACS Result:', acs);", "")

with open('energy-map.html', 'w') as f:
    f.write(content)
