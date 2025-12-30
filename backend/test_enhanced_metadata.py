import requests
import os
import sys

BASE_URL = "http://127.0.0.1:8000"
TEST_FILE_PATH = r"d:\EDHkeep\testfiles\moxfield_haves_2025-12-30-1154Z.csv"

def log(msg, success=True):
    icon = "✅" if success else "❌"
    print(f"{icon} {msg}")

def test_enhanced_data():
    if not os.path.exists(TEST_FILE_PATH):
        print("Skipping upload test: File not found")
        return

    print("Uploading file to check for enhanced metadata...")
    try:
        with open(TEST_FILE_PATH, 'rb') as f:
            files = {'file': (os.path.basename(TEST_FILE_PATH), f, 'text/csv')}
            r = requests.post(f"{BASE_URL}/collection/upload", files=files, timeout=60)
            
            if r.status_code == 200:
                res = r.json()
                preview = res.get('preview', [])
                all_cards = res.get('all_cards', [])
                
                # Check for metadata in Keep cards
                keep_cards = [c for c in all_cards if c['category'] == 'Keep']
                if keep_cards:
                    sample = keep_cards[0]
                    if 'edhrec_rank' in sample and sample['edhrec_rank']:
                         log(f"Metadata Validated: Found Rank #{sample['edhrec_rank']} for {sample['name']}")
                    else:
                         log(f"Metadata Missing: No rank found for Keep card {sample['name']}", False)
                         
                    if 'color_identity' in sample and sample['color_identity']:
                        log(f"Metadata Validated: Found Color {sample['color_identity']}")
                    else:
                        log(f"Metadata Missing: No color found", False)
                        
                    if 'edhrec_url' in sample and sample['edhrec_url']:
                        log(f"Metadata Validated: Found URL {sample['edhrec_url']}")
                    else:
                        log(f"Metadata Missing: No URL found", False)
                else:
                    log("Warning: No Keep cards found to validate metadata.", False)
            else:
                log(f"Upload failed: {r.status_code}", False)
    except Exception as e:
        log(f"Error: {e}", False)

if __name__ == "__main__":
    test_enhanced_data()
