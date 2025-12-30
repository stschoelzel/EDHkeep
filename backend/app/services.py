from typing import List, Dict, Any, Optional
import edhrec
from app.models import MTGCard

class EDHRecService:
    def __init__(self):
        self.client = edhrec.EDHRec()

    def get_top_cards(self, color: str = "w") -> List[Dict[str, Any]]:
        """
        Fetches top cards for a given color identity using EDHRec.
        
        Args:
            color: 'w', 'u', 'b', 'r', 'g', or combinations? 
                   EDHRec usually uses full names for routes like 'top/white', 'top/blue'.
        """
        # Map short codes to EDHRec top paths
        color_map = {
            "w": "white", "u": "blue", "b": "black", "r": "red", "g": "green",
            "colorless": "colorless", "multi": "multicolor"
        }
        
        path_segment = color_map.get(color.lower(), color.lower())
        
        # Use full JSON URL for EDHRec's static data pages
        url = f"https://json.edhrec.com/pages/top/{path_segment}.json"
        
        try:
             # _get in pyedhrec is a wrapper around requests.get
             data = self.client._get(url)
             return self._parse_card_list(data)
        except Exception as e:
            print(f"Error fetching top cards for {color} from {url}: {e}")
            return []

    def _parse_card_list(self, data: Dict) -> List[Dict[str, Any]]:
        cards = []
        # EDHRec JSON structure usually: container -> json_dict -> cardlists
        # Or sometimes directly if unwrapped.
        
        root = data
        if 'container' in data:
            root = data['container'].get('json_dict', {})
            if 'cardlists' not in root:
                # Sometimes it might be directly in container? Unlikely but check.
                root = data['container']
        
        if 'cardlists' in root:
            for cardlist in root['cardlists']:
                 # We only want the main lists, maybe filter by header?
                 # For now, take all cards found on the "Top X" page.
                 for card in cardlist.get('cardviews', []):
                     cards.append(card)
        return cards

    def get_card_stats(self, card_name: str) -> Dict[str, Any]:
        """
        Fetches specific stats for a card using the client.
        """
        try:
            return self.client.get_card_details(card_name)
        except Exception as e:
            print(f"Error fetching stats for {card_name}: {e}")
            return {}
