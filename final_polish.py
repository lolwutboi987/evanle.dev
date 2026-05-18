import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# 1. Make fetchLiveData safer
live_data_safe = """                for (const [id, path] of Object.entries(types)) {
                    try {
                        const res = await fetch(`${EIA_API_BASE}/${path}&api_key=${key}&frequency=monthly&length=50`);
                        const json = await res.json();
                        if (json && json.response && json.response.data) {
                            energyData[id] = {};
                            json.response.data.forEach(item => {
                                const s = item.stateid || 'US';
                                const val = item.sales || item.value;
                                if (!energyData[id][s]) energyData[id][s] = { value: val, trend: [] };
                                if (energyData[id][s].trend.length < 6) energyData[id][s].trend.unshift(val);
                            });
                        }
                    } catch (err) { console.error(`EIA ${id} fetch error:`, err); }
                }"""

content = re.sub(r"for \(const \[id, path\] of Object\.entries\(types\)\) \{.*?energyData\[id\] = \{\};.*?json\.response\.data\.forEach\(item => \{.*?\}\);.*?\}", live_data_safe, content, flags=re.DOTALL)

# 2. Add visual indication for "No Data" in updateCharts
update_charts_fix = """            comparisonChart.data.datasets[0].data = states.map(s => {
                let v = (energyData[view] && energyData[view][s]) ? energyData[view][s].value : 0;
                let pop = (censusData[s] || DEMO_CENSUS[s] || 1);
                return metric === 'perCapita' ? (v * getUnits().conv / pop) : v;
            });"""

content = content.replace("return metric === 'perCapita' ? (v * getUnits().conv / (censusData[s] || 1)) : v;", "let pop = (censusData[s] || DEMO_CENSUS[s] || 1);\n                return metric === 'perCapita' ? (v * getUnits().conv / pop) : v;")

with open('energy-map.html', 'w') as f:
    f.write(content)
