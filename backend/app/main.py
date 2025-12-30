from fastapi import FastAPI
from app.models import MTGCard
from app.analysis import calculate_cutoff_index
from app.services import EDHRecService

app = FastAPI(title="EDHKeep Backend")
edhrec_service = EDHRecService()

@app.get("/")
def read_root():
    return {"message": "Welcome to EDHKeep Backend"}

@app.post("/analyze/cutoff")
def analyze_cutoff(data: list[float]):
    """
    Test endpoint for the Drop-off Algorithm.
    """
    cutoff_index = calculate_cutoff_index(data)
    return {"cutoff_index": cutoff_index, "value_at_cutoff": data[cutoff_index] if data else None}

@app.get("/cards/top/{color}")
def get_top_cards(color: str):
    """
    Fetch top cards for a color (Stub).
    """
    cards = edhrec_service.get_top_cards(color)
    return {"color": color, "count": len(cards), "cards": cards}
