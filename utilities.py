import re
import os
import sys

def clean_project():
    """Removes redundant fix scripts and temporary files."""
    redundant_files = [
        "cleanup_energy_map.py", "final_fix.py", "final_polish.py",
        "finalize_demo_data.py", "fix_acs_and_logging.py", "fix_census_url.py",
        "fix_charts_and_debug.py", "fix_energy_map.py", "fix_final_logic.py",
        "fix_final_v9.py", "fix_grid_display.py", "fix_init.py",
        "fix_scaling.py", "fix_search_final.py", "fix_search_logic.py",
        "improve_error_handling.py", "restore_grid_chart.py",
        "restore_grid_update.py", "update_demo_data.py", "master_energy_fix.py",
        "test_tigerweb.py", "fix_css.py", "cleanup_html.py", "fix_autocomplete.py",
        "cleanup_redundant.py", "cleanup_redundant_v2.py", "final_refactor.py",
        "fix_html.py", "debug_data.py", "final_verify.js", "diagnose_search.py",
        "test_tiger.js", "test_tiger.py", "fix_final_polish.py", "fix_final_polish_v2.py",
        "fix_search_robustness.py", "fix_search_bug.py"
    ]
    for f in redundant_files:
        if os.path.exists(f):
            try:
                os.remove(f)
                print(f"Removed: {f}")
            except Exception as e:
                print(f"Error removing {f}: {e}")

def update_api_keys(eia_key, census_key):
    """Updates API keys in energy-map.html."""
    if not os.path.exists('energy-map.html'):
        print("Error: energy-map.html not found.")
        return
    with open('energy-map.html', 'r') as f:
        content = f.read()
    content = re.sub(r"(EIA_API_KEY:\s*').*?(')", f"\\1{eia_key}\\2", content)
    content = re.sub(r"(CENSUS_API_KEY:\s*').*?(')", f"\\1{census_key}\\2", content)
    with open('energy-map.html', 'w') as f:
        f.write(content)
    print("API keys updated in energy-map.html.")

def apply_final_fixes():
    """Applies final logic and UI polish to energy-map.html."""
    if not os.path.exists('energy-map.html'):
        return
    with open('energy-map.html', 'r') as f:
        content = f.read()

    # Ensure window.onload is correctly set
    content = content.replace("onload = init;", "window.onload = init;")

    # Ensure z-index for autocomplete is high enough
    content = content.replace("z-index: 1000;", "z-index: 9999;")

    # Add a global error handler for debugging
    error_handler = """
    window.onerror = function(msg, url, line, col, error) {
        console.error("GLOBAL ERROR: " + msg + " at " + url + ":" + line);
        return false;
    };"""
    if "window.onerror" not in content:
        content = content.replace("<script>", "<script>\n" + error_handler)

    with open('energy-map.html', 'w') as f:
        f.write(content)
    print("Final fixes applied to energy-map.html.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--clean":
            clean_project()
        elif sys.argv[1] == "--set-keys" and len(sys.argv) == 4:
            update_api_keys(sys.argv[2], sys.argv[3])
        elif sys.argv[1] == "--polish":
            apply_final_fixes()
        else:
            print("Usage: python3 utilities.py [--clean | --set-keys <EIA> <CENSUS> | --polish]")
    else:
        print("Usage: python3 utilities.py [--clean | --set-keys | --polish]")
