with open('energy-map.html', 'r') as f:
    content = f.read()

# Update chart title in updateCharts
update_charts_orig = """        function updateCharts() {
            const view = document.getElementById('data-view').value;
            const metric = document.getElementById('metric-type').value;
            const states = Object.keys(energyData[view] || {}).slice(0, 5);"""

update_charts_fix = """        function updateCharts() {
            const view = document.getElementById('data-view').value;
            const metric = document.getElementById('metric-type').value;
            const units = getUnits();
            const label = metric === 'perCapita' ? units.perCapita : units.main;
            document.getElementById('comp-title').innerText = `REGIONAL COMPARATIVE DATA (${label})`;

            const states = Object.keys(energyData[view] || {}).slice(0, 5);"""

content = content.replace(update_charts_orig, update_charts_fix)

# Add console logs to fetchACSData and fetchCityData for debugging
content = content.replace(
    "const acs = await fetchACSData(stateFips, placeFips);",
    "console.log('Fetching ACS for State:', stateFips, 'Place:', placeFips); const acs = await fetchACSData(stateFips, placeFips); console.log('ACS Result:', acs);"
)

# Ensure unit conversion is correct for NatGas and Fuel
# NatGas is in MMCF (Million Cubic Feet). Per capita should be MCF (Thousand Cubic Feet).
# conv: 1000 is correct.
# Fuel is in Barrels. Per capita should be Gallons.
# conv: 42 is correct.

with open('energy-map.html', 'w') as f:
    f.write(content)
