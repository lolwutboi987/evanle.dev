import re
import os

def clean_project():
    """
    Removes redundant fix scripts and other temporary files.
    """
    redundant_files = [
        "cleanup_energy_map.py", "final_fix.py", "final_polish.py",
        "finalize_demo_data.py", "fix_acs_and_logging.py", "fix_census_url.py",
        "fix_charts_and_debug.py", "fix_energy_map.py", "fix_final_logic.py",
        "fix_final_v9.py", "fix_grid_display.py", "fix_init.py",
        "fix_scaling.py", "fix_search_final.py", "fix_search_logic.py",
        "improve_error_handling.py", "restore_grid_chart.py",
        "restore_grid_update.py", "update_demo_data.py", "master_energy_fix.py",
        "test_tigerweb.py", "fix_css.py", "cleanup_html.py"
    ]

    for f in redundant_files:
        if os.path.exists(f):
            try:
                os.remove(f)
                print(f"Removed: {f}")
            except Exception as e:
                print(f"Error removing {f}: {e}")

def update_api_keys(eia_key, census_key):
    """
    Updates API keys in energy-map.html within the APP_CONFIG object.
    """
    if not os.path.exists('energy-map.html'):
        print("Error: energy-map.html not found.")
        return

    with open('energy-map.html', 'r') as f:
        content = f.read()

    # Update EIA_API_KEY inside APP_CONFIG
    content = re.sub(r"(EIA_API_KEY:\s*').*?(')", f"\\1{eia_key}\\2", content)
    # Update CENSUS_API_KEY inside APP_CONFIG
    content = re.sub(r"(CENSUS_API_KEY:\s*').*?(')", f"\\1{census_key}\\2", content)

    with open('energy-map.html', 'w') as f:
        f.write(content)
    print("API keys updated in energy-map.html within APP_CONFIG.")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        if sys.argv[1] == "--clean":
            clean_project()
        elif sys.argv[1] == "--set-keys" and len(sys.argv) == 4:
            update_api_keys(sys.argv[2], sys.argv[3])
        else:
            print("Usage:")
            print("  python3 utilities.py --clean")
            print("  python3 utilities.py --set-keys <EIA_KEY> <CENSUS_KEY>")
    else:
        print("Usage: python3 utilities.py [--clean | --set-keys]")
