import csv
from io import StringIO
from typing import List, Dict, Optional
from app.models import MTGCard

class CSVService:
    def __init__(self):
        # Known mappings for different formats (Moxfield is default)
        # Based on MtgCsvHelper support
        self.column_mappings = {
            "moxfield": {
                "name": ["Name", "Card Name"],
                "set": ["Edition", "Set", "Set Code"],
                "count": ["Count", "Quantity", "Tradelist Count"],
                "u_id": ["Collector Number"],
                "foil": ["Foil", "Etched"]
            },
            "dragonshield": {
                 "name": ["Card Name"],
                 "set": ["Set Code"],
                 "count": ["Quantity"],
                 "u_id": ["Card Number"]
            },
            "manabox": {
                "name": ["Name"],
                "set": ["Set Code"],
                "count": ["Quantity"],
                "u_id": ["Collector Number"]
            },
            "deckbox": {
                 "name": ["Name"],
                 "set": ["Edition"],
                 "count": ["Count"],
                 "u_id": ["Card Number"]
            }
        }

    def detect_format(self, headers: List[str]) -> str:
        """
        Detect CSV format based on headers, mimicking MtgCsvHelper logic.
        """
        h_set = set(headers)
        
        if "Tradelist Count" in h_set and "Edition" in h_set:
            return "moxfield"
        if "Folder Name" in h_set and "Price" in h_set and "Card Name" in h_set:
             return "dragonshield" # DragonShield text export
        if "Binder Name" in h_set and "Scryfall ID" in h_set:
             return "manabox"
             
        # Fallback to Moxfield if basic fields match
        if "Edition" in h_set and "Name" in h_set:
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
                card = MTGCard(
                    name=name,
                    set=set_code if set_code else "UNK",
                    collector_number=cn,
                    type_line="Unknown",
                    category="Pending" 
                )
                cards.append(card)
                
        return cards

    def generate_csv(self, cards: List[MTGCard], format_type: str = "moxfield") -> str:
        """
        Generates a CSV string for the given cards in the specified format.
        """
        output = StringIO()
        
        if format_type == "moxfield":
            fieldnames = ["Count", "Tradelist Count", "Name", "Edition", "Condition", "Language", "Foil", "Tag", "Collector Number"]
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            
            for c in cards:
                writer.writerow({
                    "Count": "1", # Default to 1 for now
                    "Tradelist Count": "0",
                    "Name": c.name,
                    "Edition": c.set_code,
                    "Condition": "Near Mint",
                    "Language": "English",
                    "Foil": "",
                    "Tag": c.category, # Useful to tag them back in Moxfield!
                    "Collector Number": c.collector_number
                })
        
        elif format_type == "dragonshield":
             # Simplified DragonShield export
             fieldnames = ["Card Name", "Set Code", "Quantity", "Card Number"]
             writer = csv.DictWriter(output, fieldnames=fieldnames)
             writer.writeheader()
             for c in cards:
                 writer.writerow({
                     "Card Name": c.name,
                     "Set Code": c.set_code,
                     "Quantity": "1",
                     "Card Number": c.collector_number
                 })
        
        # Add others as needed
        
        return output.getvalue()
