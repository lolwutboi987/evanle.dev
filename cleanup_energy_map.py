import re

with open('energy-map.html', 'r') as f:
    content = f.read()

# Define the clean block for fetchGridData, fetchACSData and fetchCityData
clean_functions = """
        async function fetchACSData(stateFips, placeFips) {
            try {
                const res = await fetch(`https://api.census.gov/data/2021/acs/acs5?get=NAME,B25040_001E,B25040_004E,B25040_002E,B19013_001E&for=place:${placeFips}&in=state:${stateFips}`);
                const json = await res.json();
                if (json && json[1]) {
                    const total = parseInt(json[1][1]);
                    const elec = parseInt(json[1][2]);
                    const gas = parseInt(json[1][3]);
                    const income = parseInt(json[1][4]);
                    return {
                        elecIntensity: total > 0 ? (elec / total) / 0.25 : 1,
                        gasIntensity: total > 0 ? (gas / total) / 0.50 : 1,
                        incomeFactor: income > 0 ? (income / 70000) : 1
                    };
                }
            } catch (e) { console.error(`ACS Fetch Error:`, e); }
            return { elecIntensity: 1, gasIntensity: 1, incomeFactor: 1 };
        }

        async function fetchGridData(key) {
            const baMap = { 'CA': 'CISO', 'TX': 'ERCO', 'NY': 'NYIS', 'FL': 'FPL', 'WA': 'BPAT', 'IL': 'PJM', 'AZ': 'SRP', 'NV': 'NEVP', 'OR': 'BPAT', 'UT': 'PACE', 'GA': 'SOCO', 'NC': 'DUK' };
            const city = DEMO_CITIES[currentRegion];
            const state = city ? city.state : currentRegion;
            const ba = baMap[state] || 'CISO';
            try {
                const res = await fetch(`https://api.eia.gov/v2/electricity/rto/region-data/data/?api_key=${key}&frequency=hourly&data[]=value&facets[respondent][]=${ba}&sort[0][column]=period&sort[0][direction]=desc&length=24`);
                const json = await res.json();
                if (json && json.response && json.response.data && json.response.data.length > 0) {
                    const gridTrend = json.response.data.map(d => d.value).reverse();
                    updateGridChart(gridTrend, ba);
                } else {
                    document.getElementById('grid-panel').style.display = 'none';
                }
            } catch (e) {
                console.error("Grid API Error:", e);
                document.getElementById('grid-panel').style.display = 'none';
            }
        }

        async function fetchCityData(cityName, stateFips) {
            const btn = document.getElementById('search-btn');
            btn.innerText = 'Initializing...';
            try {
                const tigerUrl = `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/25/query?where=${encodeURIComponent(`(UPPER(BASENAME) = '${cityName.toUpperCase()}' OR UPPER(NAME) LIKE '${cityName.toUpperCase()}%') AND STATE='${stateFips}'`)}&outFields=NAME,STATE,POP100,GEOID,PLACE,BASENAME&f=geojson&outSR=4326`;
                const tigerRes = await fetch(tigerUrl);
                const tigerJson = await tigerRes.json();
                if (tigerJson.features && tigerJson.features.length > 0) {
                    let feature = tigerJson.features.find(f =>
                        f.properties.BASENAME && f.properties.BASENAME.toUpperCase() === cityName.toUpperCase()
                    ) || tigerJson.features[0];
                    const fullName = feature.properties.NAME;

                    Object.keys(DEMO_CITIES).forEach(k => {
                        if (k.toLowerCase().includes(cityName.toLowerCase())) {
                            if (cityLayers[k]) map.removeLayer(cityLayers[k]);
                            delete DEMO_CITIES[k];
                        }
                    });
                    const placeFips = feature.properties.PLACE || feature.properties.GEOID.slice(-5);
                    const acs = await fetchACSData(stateFips, placeFips);
                    DEMO_CITIES[fullName] = {
                        pop: parseInt(feature.properties.POP100) || 50000,
                        geometry: feature.geometry,
                        state: fipsToAbbr[stateFips],
                        acs: acs
                    };
                    currentRegion = fullName;
                    updateMap(); updateCharts();
                    map.flyToBounds(L.geoJson(feature.geometry).getBounds(), { padding: [50, 50], duration: 1.5 });
                } else {
                    console.warn('City not found:', cityName);
                    btn.innerText = 'NOT FOUND';
                    setTimeout(() => btn.innerText = 'Initialize Search', 2000);
                }
            } catch (e) { console.error(e); } finally { btn.innerText = 'Initialize Search'; }
        }
"""

# We'll replace everything from "async function fetchACSData" (or wherever it was)
# down to "function setupEventListeners"

pattern = re.compile(r"async function fetchACSData.*?function setupEventListeners", re.DOTALL)
new_content = pattern.sub(clean_functions + "\\n        function setupEventListeners", content)

with open('energy-map.html', 'w') as f:
    f.write(new_content)
