import requests
import json

def check_images():
    url = "https://json.edhrec.com/pages/top/white.json"
    try:
        r = requests.get(url)
        data = r.json()
        
        # Traverse to find a card
        root = data.get('container', {}).get('json_dict', {})
        cardlists = root.get('cardlists', [])
        
        if cardlists:
            first_list = cardlists[0]
            cards = first_list.get('cardviews', [])
            if cards:
                sample = cards[0]
                print("Sample Card Keys:", sample.keys())
                if 'image_uris' in sample:
                    print("Found 'image_uris':", sample['image_uris'])
                elif 'images' in sample:
                    print("Found 'images':", sample['images'])
                else:
                    print("No obvious image key found.")
                    # Sometimes it is flattened?
                    print("Sample dump:", json.dumps(sample, indent=2))
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_images()
