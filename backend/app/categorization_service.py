from typing import List, Dict
from app.models import MTGCard
from app.services import EDHRecService
from app.analysis import calculate_cutoff_index

class CategorizationService:
    def __init__(self, edhrec_service: EDHRecService):
        self.edhrec = edhrec_service
        self.cache = {} # cache for top card lists: {color: {'cards': [], 'cutoff': int}}

    def _get_top_cards_with_cutoff(self, color: str):
        if color in self.cache:
            return self.cache[color]

        print(f"Fetching and analyzing Top cards for {color}...")
        cards = self.edhrec.get_top_cards(color)
        
        rates = []
        for c in cards:
            if 'num_decks' in c:
                 rates.append(c['num_decks'])
        
        cutoff_idx = calculate_cutoff_index(rates)
        
        # Store metadata for enrichment
        keep_data = {}
        pending_data = {}
        
        for i, card in enumerate(cards):
            name = card.get('name')
            if not name: continue
            
            # Normalize
            normalized_name = name.split(" // ")[0] 
            
            # Extract useful data
            rank = i + 1 # Rank in this specific color list
            url = f"https://edhrec.com{card.get('url', '')}" if card.get('url') else None
            # EDHRec raw data often has 'url' relative path
            
            meta = {
                'rank': rank,
                'url': url,
                'color': color.upper(), # Inference
                'inclusion': card.get('num_decks', 0)
            }
            
            if i <= cutoff_idx:
                keep_data[normalized_name] = meta
            elif i <= cutoff_idx + 50:
                pending_data[normalized_name] = meta
                
        self.cache[color] = {'keep': keep_data, 'pending': pending_data}
        return self.cache[color]

    def categorize_collection(self, collection: List[MTGCard]) -> List[MTGCard]:
        colors = ['w', 'u', 'b', 'r', 'g']
        
        # Aggregate logic: A card might appear in multiple top lists (e.g. Artifacts in Blue and White).
        # We prioritize "Keep" status.
        
        global_keep_map = {}
        global_pending_map = {}
        
        for c in colors:
            data = self._get_top_cards_with_cutoff(c)
            global_keep_map.update(data['keep'])
            global_pending_map.update(data['pending'])
            
        # Categorize
        for card in collection:
            name = card.name.split(" // ")[0]
            
            # Shared helper to generate image URL
            def get_image_url(card_name, set_code):
                 if set_code and set_code.lower() != "unk":
                     return f"https://api.scryfall.com/cards/named?exact={card_name}&set={set_code}&format=image"
                 return f"https://api.scryfall.com/cards/named?exact={card_name}&format=image"

            if name in global_keep_map:
                card.category = "Keep"
                meta = global_keep_map[name]
                card.edhrec_rank = meta['rank']
                card.edhrec_url = meta['url']
                card.color_identity = meta['color']
                card.inclusion_rate = meta['inclusion']
                card.image_uris = {"normal": get_image_url(name, card.set_code)}

            elif name in global_pending_map:
                card.category = "Pending"
                meta = global_pending_map[name]
                card.edhrec_rank = meta['rank']
                card.edhrec_url = meta['url']
                card.color_identity = meta['color']
                card.inclusion_rate = meta['inclusion']
                card.image_uris = {"normal": get_image_url(name, card.set_code)}

            else:
                card.category = "Fail"
                card.image_uris = {"normal": get_image_url(name, card.set_code)}
                
        return collection
