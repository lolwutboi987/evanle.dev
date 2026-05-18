with open('energy-map.html', 'r') as f:
    content = f.read()

# Fix init to ensure demo data is loaded into energyData and censusData
init_orig = """        async function init() {
            initMap();
            initCharts();
            initGridChart();
            setupEventListeners();
            try { await refreshData(); } catch(e) { console.warn('Initial data refresh failed, using demo data', e); updateMap(); updateCharts(); }
        }"""

init_fix = """        async function init() {
            initMap();
            initCharts();
            initGridChart();
            setupEventListeners();
            // Load Demo Data as Baseline
            energyData = JSON.parse(JSON.stringify(DEMO_STATES));
            censusData = JSON.parse(JSON.stringify(DEMO_CENSUS));
            try { await refreshData(); } catch(e) { console.warn('Initial data refresh failed, using demo data', e); }
            updateMap(); updateCharts();
        }"""

content = content.replace(init_orig, init_fix)

with open('energy-map.html', 'w') as f:
    f.write(content)
