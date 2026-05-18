import re

with open('energy-map.html', 'r') as f:
    content = f.read()

grid_chart_func = """
        function initGridChart() {
            gridChart = new Chart(document.getElementById('gridChart'), {
                type: 'line',
                data: { labels: Array.from({length: 24}, (_, i) => i + ':00'), datasets: [{ borderColor: '#BD0026', data: [], tension: 0.1, fill: false }] },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: '#a1a19a', font: { size: 10 } } },
                        y: { ticks: { color: '#a1a19a', font: { size: 10 } } }
                    }
                }
            });
        }
"""

# Insert before fetchACSData
content = content.replace('async function fetchACSData', grid_chart_func + '\n        async function fetchACSData')

with open('energy-map.html', 'w') as f:
    f.write(content)
