import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# Update DEMO_STATES
demo_states_new = """        const DEMO_STATES = {
            'elec': {
                'CA': { value: 21000000, trend: [20500, 20800, 21000, 20900, 21200, 21500], name: 'California' },
                'TX': { value: 35000000, trend: [34000, 34500, 35000, 34800, 35500, 36000], name: 'Texas' },
                'NY': { value: 12500000, trend: [12000, 12200, 12500, 12300, 12800, 13000], name: 'New York' },
                'WA': { value: 7500000, trend: [7200, 7300, 7500, 7400, 7600, 7700], name: 'Washington' }
            },
            'ng': {
                'CA': { value: 180000, trend: [170, 175, 180, 178, 182, 185], name: 'California' },
                'TX': { value: 350000, trend: [330, 340, 350, 345, 360, 370], name: 'Texas' }
            },
            'fuel': {
                'CA': { value: 15420000, trend: [14800, 15000, 15420, 15300, 15600, 15800], name: 'California' },
                'WA': { value: 4200000, trend: [3800, 4000, 4200, 4100, 4300, 4400], name: 'Washington' }
            }
        };"""

content = re.sub(r"const DEMO_STATES = \{.*?^\s+};" , demo_states_new, content, flags=re.DOTALL | re.MULTILINE)

with open('energy-map.html', 'w') as f:
    f.write(content)
