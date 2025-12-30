import csv
from io import StringIO
from typing import List, Dict, Optional
from app.models import MTGCard

class CSVService:
    def __init__(self):
        # Known mappings for different formats (Moxfield is default)
        self.column_mappings = {
            "moxfield": {
                "name": ["Name", "Card Name"],
                "set": ["Edition", "Set", "Set Code"],
                "count": ["Count", "Quantity"],
                "u_id": ["Collector Number"] 
            }
            # Add DragonShield/ManaBox later
        }

    def detect_format(self, headers: List[str]) -> str:
        """
        Simple heuristic to detect CSV format based on headers.
        """
        # Moxfield usually has "Count" and "Edition"
        if "Edition" in headers and "Name" in headers:
            return "moxfield"
        return "generic"

    def parse_csv(self, file_content: str) -> List[MTGCard]:
        """
        Parses CSV content into a list of partial MTGCard objects.
        """
        file = StringIO(file_content)
        reader = csv.DictReader(file)
        
        if not reader.fieldnames:
            return []
            
        fmt = self.detect_format(reader.fieldnames)
        mapping = self.column_mappings.get(fmt, self.column_mappings["moxfield"])
        
        cards = []
        for row in reader:
            # Helper to find value from potential column names
            def get_val(keys):
                for k in keys:
                    if k in row:
                        return row[k]
                return None

            name = get_val(mapping["name"])
            set_code = get_val(mapping["set"])
            cn = get_val(mapping["u_id"]) or "0" # Default if missing
            
            if name:
                # Create rudimentary card object. 
                # Note: We won't have full Scryfall data yet, just what's in CSV.
                card = MTGCard(
                    name=name,
                    set=set_code if set_code else "UNK",
                    collector_number=cn,
                    type_line="Unknown", # Placeholder until Scryfall enrichment
                    category="Pending"   # Default status
                )
                cards.append(card)
                
        return cards
