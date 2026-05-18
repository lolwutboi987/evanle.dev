import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# 1. Expand NG and FUEL coverage in DEMO_STATES
demo_states_full = """        const DEMO_STATES = {
            'elec': {
                'CA': { value: 21000000, trend: [20500000, 20800000, 21000000, 20900000, 21200000, 21500000], name: 'California' },
                'TX': { value: 35000000, trend: [34000000, 34500000, 35000000, 34800000, 35500000, 36000000], name: 'Texas' },
                'NY': { value: 12500000, trend: [12000000, 12200000, 12500000, 12300000, 12800000, 13000000], name: 'New York' },
                'WA': { value: 7500000, trend: [7200000, 7300000, 7500000, 7400000, 7600000, 7700000], name: 'Washington' },
                'FL': { value: 22000000, trend: [21000000, 21500000, 22000000, 21800000, 22500000, 23000000], name: 'Florida' },
                'IL': { value: 11000000, trend: [10500000, 10800000, 11000000, 10900000, 11200000, 11500000], name: 'Illinois' },
                'OR': { value: 4500000, trend: [4200000, 4400000, 4500000, 4450000, 4600000, 4700000], name: 'Oregon' },
                'NV': { value: 3200000, trend: [3000000, 3100000, 3200000, 3150000, 3300000, 3400000], name: 'Nevada' },
                'AZ': { value: 6800000, trend: [6500000, 6700000, 6800000, 6750000, 6900000, 7000000], name: 'Arizona' },
                'UT': { value: 2800000, trend: [2600000, 2700000, 2800000, 2750000, 2900000, 3000000], name: 'Utah' }
            },
            'ng': {
                'CA': { value: 180000, trend: [170000, 175000, 180000, 178000, 182000, 185000], name: 'California' },
                'TX': { value: 350000, trend: [330000, 340000, 350000, 345000, 360000, 370000], name: 'Texas' },
                'NY': { value: 110000, trend: [100000, 105000, 110000, 108000, 112000, 115000], name: 'New York' },
                'WA': { value: 25000, trend: [22000, 24000, 25000, 24500, 26000, 27000], name: 'Washington' },
                'IL': { value: 85000, trend: [80000, 82000, 85000, 84000, 86000, 88000], name: 'Illinois' },
                'FL': { value: 45000, trend: [40000, 42000, 45000, 44000, 46000, 48000], name: 'Florida' },
                'OR': { value: 15000, trend: [14000, 14500, 15000, 14800, 15500, 16000], name: 'Oregon' },
                'NV': { value: 12000, trend: [11000, 11500, 12000, 11800, 12500, 13000], name: 'Nevada' },
                'AZ': { value: 18000, trend: [16000, 17000, 18000, 17500, 18500, 19000], name: 'Arizona' },
                'UT': { value: 14000, trend: [13000, 13500, 14000, 13800, 14500, 15000], name: 'Utah' }
            },
            'fuel': {
                'CA': { value: 15420000, trend: [14800000, 15000000, 15420000, 15300000, 15600000, 15800000], name: 'California' },
                'WA': { value: 4200000, trend: [3800000, 4000000, 4200000, 4100000, 4300000, 4400000], name: 'Washington' },
                'TX': { value: 25000000, trend: [24000000, 24500000, 25000000, 24800000, 25500000, 26000000], name: 'Texas' },
                'NY': { value: 8500000, trend: [8000000, 8200000, 8500000, 8400000, 8600000, 8800000], name: 'New York' },
                'FL': { value: 12000000, trend: [11500000, 11800000, 12000000, 11900000, 12200000, 12400000], name: 'Florida' },
                'IL': { value: 9500000, trend: [9000000, 9200000, 9500000, 9400000, 9600000, 9800000], name: 'Illinois' },
                'OR': { value: 2500000, trend: [2400000, 2450000, 2500000, 2480000, 2550000, 2600000], name: 'Oregon' },
                'NV': { value: 1800000, trend: [1700000, 1750000, 1800000, 1780000, 1850000, 1900000], name: 'Nevada' },
                'AZ': { value: 3200000, trend: [3000000, 3100000, 3200000, 3150000, 3300000, 3400000], name: 'Arizona' },
                'UT': { value: 1500000, trend: [1400000, 1450000, 1500000, 1480000, 1550000, 1600000], name: 'Utah' }
            }
        };"""
content = re.sub(r"const DEMO_STATES = \{.*?^\s+};" , demo_states_full, content, flags=re.DOTALL | re.MULTILINE)

# 2. Fix fetchGridData to use state code correctly
grid_fix_orig = """            const baMap = { 'CA': 'CISO', 'TX': 'ERCO', 'NY': 'NYIS', 'FL': 'FPL', 'WA': 'BPAT' };
            const ba = baMap[currentRegion] || 'CISO';"""

grid_fix_new = """            const baMap = { 'CA': 'CISO', 'TX': 'ERCO', 'NY': 'NYIS', 'FL': 'FPL', 'WA': 'BPAT', 'IL': 'PJM', 'AZ': 'SRP', 'NV': 'NEVP', 'OR': 'BPAT', 'UT': 'PACE' };
            const city = DEMO_CITIES[currentRegion];
            const state = city ? city.state : currentRegion;
            const ba = baMap[state] || 'CISO';"""

content = content.replace(grid_fix_orig, grid_fix_new)

# 3. Enhance fetchCityData to remove duplicate markers and improve zoom
search_logic_fix = """                if (tigerJson.features && tigerJson.features.length > 0) {
                    let feature = tigerJson.features.find(f =>
                        f.properties.BASENAME && f.properties.BASENAME.toUpperCase() === cityName.toUpperCase()
                    ) || tigerJson.features[0];
                    const fullName = feature.properties.NAME;

                    // Cleanup existing markers for this city to prevent visual clutter
                    Object.keys(DEMO_CITIES).forEach(k => {
                        if (k.toLowerCase().includes(cityName.toLowerCase())) {
                            if (cityLayers[k]) map.removeLayer(cityLayers[k]);
                            delete DEMO_CITIES[k];
                        }
                    });"""

content = re.sub(r"if \(tigerJson\.features && tigerJson\.features\.length > 0\) \{.*?let feature = tigerJson\.features\.find\(f =>.*?\) \|\| tigerJson\.features\[0\];.*?const fullName = feature\.properties\.NAME;", search_logic_fix, content, flags=re.DOTALL)

with open('energy-map.html', 'w') as f:
    f.write(content)
