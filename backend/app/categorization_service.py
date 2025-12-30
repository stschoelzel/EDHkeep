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
        
        # Extract inclusion rates for cutoff calculation
        # Assuming 'inclusion' field exists and is comparable. 
        # EDHRec data often has 'num_decks' or 'label' (e.g. "55% of decks").
        # We need to parse percentages.
        
        rates = []
        for c in cards:
            # Heuristic to parse inclusion rate. 
            # In raw JSON, it might be 'label' with text, or 'num_decks'.
            # We'll need to inspect the card object structure from previous debug session.
            # Assuming 'num_decks' is integer.
            if 'num_decks' in c:
                 rates.append(c['num_decks'])
        
        cutoff_idx = calculate_cutoff_index(rates)
        
        # Create a set of "Keep" names (up to cutoff)
        # And "Pending" (Cutoff to Cutoff + 50)
        
        keep_set = set()
        pending_set = set()
        
        for i, card in enumerate(cards):
            name = card.get('name')
            if not name: continue
            
            # Basic normalization
            name = name.split(" // ")[0] 
            
            if i <= cutoff_idx:
                keep_set.add(name)
            elif i <= cutoff_idx + 50:
                pending_set.add(name)
                
        self.cache[color] = {'keep': keep_set, 'pending': pending_set}
        return self.cache[color]

    def categorize_collection(self, collection: List[MTGCard]) -> List[MTGCard]:
        # Pre-load basic colors (WUBRG)
        # For a full implementation, we'd check the collection's colors first.
        colors = ['w', 'u', 'b', 'r', 'g']
        
        # Combine all Keep/Pending sets for O(1) lookup
        # This is a simplification. Ideally check against specific color identity.
        # But for "General Keep", checking against any mono-color Top list is a good start.
        
        global_keep = set()
        global_pending = set()
        
        for c in colors:
            data = self._get_top_cards_with_cutoff(c)
            global_keep.update(data['keep'])
            global_pending.update(data['pending'])
            
        # Categorize
        for card in collection:
            # Normalize name
            name = card.name.split(" // ")[0]
            
            if name in global_keep:
                card.category = "Keep"
            elif name in global_pending:
                card.category = "Pending"
            else:
                card.category = "Fail"
                
        return collection
