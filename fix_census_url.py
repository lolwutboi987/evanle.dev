import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix Census Population URL and query params
census_fix = """                const cRes = await fetch(`https://api.census.gov/data/2021/acs/acs5?get=NAME,B01003_001E&for=state:*`);
                const cJson = await cRes.json();
                cJson.slice(1).forEach(r => {
                    const abbr = fipsToAbbr[r[2]];
                    if (abbr) censusData[abbr] = parseInt(r[1]);
                });"""

content = re.sub(r"const cRes = await fetch\(\`\$\{CENSUS_API_BASE\}\?get=POP,NAME&for=state:\*\`\);.*?cJson\.slice\(1\)\.forEach\(r => censusData\[fipsToAbbr\[r\[2\]\]\] = parseInt\(r\[0\]\)\);", census_fix, content, flags=re.DOTALL)

with open('energy-map.html', 'w') as f:
    f.write(content)
