import requests
import json
import sys
import os

BASE_URL = "http://127.0.0.1:8000"
TEST_FILE_PATH = r"d:\EDHkeep\testfiles\moxfield_haves_2025-12-30-1154Z.csv"

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def test_root():
    try:
        r = requests.get(f"{BASE_URL}/")
        if r.status_code == 200:
            log("Root endpoint reachable")
        else:
            log(f"Root endpoint failed: {r.status_code}", False)
    except requests.exceptions.ConnectionError:
        log("Could not connect to server. Is it running?", False)
        sys.exit(1)

def test_cutoff():
    data = [100, 50, 20, 10, 5]
    try:
        r = requests.post(f"{BASE_URL}/analyze/cutoff", json=data)
        if r.status_code == 200:
            result = r.json()
            if result['cutoff_index'] == 2:
                log(f"Cutoff Algorithm Correct (Index: 2, Value: {result['value_at_cutoff']})")
            else:
                log(f"Cutoff Algorithm Unexpected Result: {result}", False)
        else:
            log(f"Cutoff endpoint failed: {r.text}", False)
    except Exception as e:
        log(f"Cutoff test error: {e}", False)

def test_top_cards():
    try:
        r = requests.get(f"{BASE_URL}/cards/top/w")
        if r.status_code == 200:
            res = r.json()
            count = len(res)
            log(f"EDHRec Integration: Fetched {count} cards for White")
            if count == 0:
                print("   (Note: 0 cards might mean parsing failed, but endpoint is reachable)")
        else:
            log(f"Top Cards endpoint failed: {r.text}", False)
    except Exception as e:
        log(f"Top Cards test error: {e}", False)

def test_csv_upload():
    if not os.path.exists(TEST_FILE_PATH):
        log(f"Test file not found at {TEST_FILE_PATH}", False)
        return

    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'text/csv')}
            r = requests.post(f"{BASE_URL}/collection/upload", files=files)
            
            if r.status_code == 200:
                res = r.json()
                parsed = res.get('cards_parsed', 0)
                log(f"CSV Upload: Successfully parsed {parsed} cards from {res.get('filename')}")
                if parsed > 0:
                    print(f"   Preview: {res.get('preview')[0]['name']}")
            else:
                log(f"CSV Upload failed: {r.status_code} {r.text}", False)
    except Exception as e:
        log(f"CSV Upload test error: {e}", False)

if __name__ == "__main__":
    print(f"Testing EDHKeep Backend at {BASE_URL}...\n")
    test_root()
    test_cutoff()
    test_top_cards()
    test_csv_upload()
    print("\nTests Complete.")
