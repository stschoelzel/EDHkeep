from pydantic import BaseModel, Field
from typing import Optional, Dict

class MTGCard(BaseModel):
    # Scryfall Data
    name: str
    set_code: str = Field(..., alias="set")
    collector_number: str
    mana_cost: Optional[str] = None
    type_line: str
    image_uris: Optional[Dict[str, str]] = None
    prices: Optional[Dict[str, Optional[str]]] = None
    
    # EDHRec Data
    edhrec_rank: Optional[int] = None
    inclusion_rate: Optional[float] = None # Percentage of decks this card is in
    edhrec_url: Optional[str] = None
    color_identity: Optional[str] = None # 'W', 'U', etc.
    
    # Categorization
    category: Optional[str] = None # "Keep", "Fail", "Pending"
    
    class Config:
        populate_by_name = True
