import re

with open('energy-map.html', 'r') as f:
    content = f.read()

grid_update_func = """
        function updateGridChart(data, ba) {
            document.getElementById('grid-panel').style.display = 'block';
            document.getElementById('grid-title').innerText = `LIVE SYSTEM LOAD (MW) - ${ba}`;
            gridChart.data.datasets[0].data = data;
            gridChart.update();
        }
"""

# Insert before fetchACSData
content = content.replace('async function fetchACSData', grid_update_func + '\n        async function fetchACSData')

with open('energy-map.html', 'w') as f:
    f.write(content)
