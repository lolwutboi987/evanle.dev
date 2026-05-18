import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# Ensure all demo states have entries for all views to prevent empty map behavior
demo_states_full = """        const DEMO_STATES = {
            'elec': {
                'CA': { value: 21000000, trend: [20500000, 20800000, 21000000, 20900000, 21200000, 21500000], name: 'California' },
                'TX': { value: 35000000, trend: [34000000, 34500000, 35000000, 34800000, 35500000, 36000000], name: 'Texas' },
                'NY': { value: 12500000, trend: [12000000, 12200000, 12500000, 12300000, 12800000, 13000000], name: 'New York' },
                'WA': { value: 7500000, trend: [7200000, 7300000, 7500000, 7400000, 7600000, 7700000], name: 'Washington' },
                'FL': { value: 22000000, trend: [21000000, 21500000, 22000000, 21800000, 22500000, 23000000], name: 'Florida' }
            },
            'ng': {
                'CA': { value: 180000, trend: [170000, 175000, 180000, 178000, 182000, 185000], name: 'California' },
                'TX': { value: 350000, trend: [330000, 340000, 350000, 345000, 360000, 370000], name: 'Texas' },
                'NY': { value: 110000, trend: [100000, 105000, 110000, 108000, 112000, 115000], name: 'New York' },
                'WA': { value: 25000, trend: [22000, 24000, 25000, 24500, 26000, 27000], name: 'Washington' }
            },
            'fuel': {
                'CA': { value: 15420000, trend: [14800000, 15000000, 15420000, 15300000, 15600000, 15800000], name: 'California' },
                'WA': { value: 4200000, trend: [3800000, 4000000, 4200000, 4100000, 4300000, 4400000], name: 'Washington' },
                'TX': { value: 25000000, trend: [24000000, 24500000, 25000000, 24800000, 25500000, 26000000], name: 'Texas' },
                'NY': { value: 8500000, trend: [8000000, 8200000, 8500000, 8400000, 8600000, 8800000], name: 'New York' }
            }
        };"""

content = re.sub(r"const DEMO_STATES = \{.*?^\s+};" , demo_states_full, content, flags=re.DOTALL | re.MULTILINE)

with open('energy-map.html', 'w') as f:
    f.write(content)
