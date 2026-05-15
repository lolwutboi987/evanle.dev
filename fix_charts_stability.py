with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix updateCharts stability
update_charts_orig = """                const city = DEMO_CITIES[currentRegion];
                const acs = city.acs || { elecIntensity: 1, gasIntensity: 1, incomeFactor: 1 };
                const intensity = view === 'elec' ? acs.elecIntensity : (view === 'ng' ? acs.gasIntensity : 1);
                let base = (energyData[view][city.state].value / censusData[city.state]) * city.pop * intensity * acs.incomeFactor;
                if (metric === 'perCapita') base = (base * getUnits().conv / city.pop);"""

update_charts_fix = """                const city = DEMO_CITIES[currentRegion];
                const acs = city.acs || { elecIntensity: 1, gasIntensity: 1, incomeFactor: 1 };
                const intensity = view === 'elec' ? acs.elecIntensity : (view === 'ng' ? acs.gasIntensity : 1);

                let stateVal = (energyData[view] && energyData[view][city.state]) ? energyData[view][city.state].value : 0;
                let statePop = censusData[city.state] || 1;

                let base = (stateVal / statePop) * city.pop * intensity * acs.incomeFactor;
                if (metric === 'perCapita') base = (base * getUnits().conv / city.pop);"""

content = content.replace(update_charts_orig, update_charts_fix)

# Fix comparisonChart data mapping stability
content = content.replace(
    "let v = energyData[view][s].value;",
    "let v = (energyData[view] && energyData[view][s]) ? energyData[view][s].value : 0;"
)

with open('energy-map.html', 'w') as f:
    f.write(content)
