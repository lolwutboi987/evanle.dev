import requests

EIA_KEY = 'lfLavxliaBhZDeDOqA1zxpMiIwRLcjJKUIdLViCK'
CENSUS_KEY = '06103124f460cf01c20a27457bf84463f9b1a3d2'

def test_eia_elec():
    url = f"https://api.eia.gov/v2/electricity/retail-sales/data/?api_key={EIA_KEY}&data[]=sales&facets[sectorid][]=RES&frequency=monthly&length=1"
    r = requests.get(url)
    print(f"EIA Elec: {r.status_code}")
    if r.status_code == 200:
        print(r.json().get('response', {}).get('data', [])[:1])

def test_eia_ng():
    url = f"https://api.eia.gov/v2/natural-gas/cons/sum/data/?api_key={EIA_KEY}&data[]=value&frequency=monthly&length=1"
    r = requests.get(url)
    print(f"EIA NG: {r.status_code}")
    if r.status_code == 200:
        print(r.json().get('response', {}).get('data', [])[:1])

def test_eia_fuel():
    # Trying the Prime Supplier Sales Volumes as per memory
    url = f"https://api.eia.gov/v2/petroleum/cons/psv/data/?api_key={EIA_KEY}&data[]=value&facets[product][]=EPM0&frequency=monthly&length=1"
    r = requests.get(url)
    print(f"EIA Fuel (PSV): {r.status_code}")
    if r.status_code == 200:
        print(r.json().get('response', {}).get('data', [])[:1])

def test_census_pop():
    url = f"https://api.census.gov/data/2021/pep/population?get=NAME,POP_2021&for=state:*&key={CENSUS_KEY}"
    r = requests.get(url)
    print(f"Census Pop: {r.status_code}")
    if r.status_code == 200:
        print(r.json()[:2])

def test_tigerweb():
    # Testing San Ramon, CA (State 06)
    sql_where = "UPPER(NAME) LIKE 'SAN RAMON%' AND STATE='06'"
    url = f"https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/25/query?where={sql_where}&outFields=NAME,STATE,PLACE,GEOID&f=json"
    r = requests.get(url)
    print(f"Tigerweb: {r.status_code}")
    if r.status_code == 200:
        print(r.json().get('features', [])[:1])

test_eia_elec()
test_eia_ng()
test_eia_fuel()
test_census_pop()
test_tigerweb()
