from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.models import MTGCard
from app.analysis import calculate_cutoff_index
from app.services import EDHRecService
from app.csv_service import CSVService
from app.categorization_service import CategorizationService

app = FastAPI(title="EDHKeep Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. In prod, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

edhrec_service = EDHRecService()
csv_service = CSVService()
categorization_service = CategorizationService(edhrec_service)

@app.get("/")
def read_root():
    return {"message": "Welcome to EDHKeep Backend"}

@app.post("/collection/upload")
async def upload_collection(file: UploadFile = File(...)):
    """
    Uploads a CSV collection, parses it, and categorizes cards.
    """
    content = await file.read()
    text_content = content.decode("utf-8")
    
    # 1. Parse
    cards = csv_service.parse_csv(text_content)
    
    # 2. Categorize
    # This might take a moment as it fetches EDHRec data on first run
    categorized_cards = categorization_service.categorize_collection(cards)
    
    # Statistics
    stats = {"Keep": 0, "Pending": 0, "Fail": 0}
    for c in categorized_cards:
        if c.category in stats:
            stats[c.category] += 1
    
    return {
        "filename": file.filename, 
        "total_cards": len(cards),
        "stats": stats,
        "preview": categorized_cards[:10], # Keep for legacy check
        "all_cards": categorized_cards # Send full list for frontend processing
    }

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
